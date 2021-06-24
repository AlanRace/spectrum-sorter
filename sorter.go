package main

import (
	"bytes"
	"encoding/binary"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/jessevdk/go-flags"
)

var opts struct {
	DataFolder string `short:"d" long:"data" description:"Folder containing data to serve" required:"true"`
	Port       string `short:"p" long:"port" description:"Port used for the server" default:"5003"`
	Server     bool   `long:"server" description:"Start just the server and don't automatically open the browser"`
}

// open opens the specified URL in the default browser of the user.
// Taken from: https://stackoverflow.com/questions/39320371/how-start-web-server-to-open-page-in-browser-in-golang
func open(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}

func startServer(listener net.Listener) {
	router := mux.NewRouter().StrictSlash(true)

	// List running processes
	// router.HandleFunc("/processes", ListProcesses).Methods("GET")
	// router.HandleFunc("/processes/{processid}", GetProcess).Methods("GET")

	router.HandleFunc("/data", ListDatasets).Methods("GET")
	router.HandleFunc("/data/{dataid}/data", GetData).Methods("GET")
	router.HandleFunc("/data/{dataid}/{spectrumid}/data", GetSpectrum).Methods("GET")
	// router.HandleFunc("/data/{dataid}/initialise", InitialiseDataset).Methods("POST")
	// router.HandleFunc("/data/{dataid}/layout", GetDataLayout).Methods("GET")
	// router.HandleFunc("/data/{dataid}/images", GetImageList).Methods("GET")
	// router.HandleFunc("/data/{dataid}/images", CreateImages).Methods("POST")
	// router.HandleFunc("/data/{dataid}/images/{imageid}", GetImage).Methods("GET")
	// router.HandleFunc("/data/{dataid}/ionthumb", GetIonThumbnail).Methods("GET")
	// router.HandleFunc("/data/{dataid}/ionthumbtransform", GetIonThumbnailTransform).Methods("GET")
	// router.HandleFunc("/data/{dataid}/optical", GetOptical).Methods("GET")
	// router.HandleFunc("/data/{dataid}/opticaltransform", GetOpticalTransform).Methods("GET")
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))

	log.Fatal(http.Serve(listener, router))
}

func main() {
	_, err := flags.Parse(&opts)

	if err != nil {
		log.Fatal(err)
		return
	}

	// Load datasets from folder
	err = loadFolder(opts.DataFolder)
	if err != nil {
		log.Fatal(err)
		return
	}

	location := ":" + opts.Port

	listener, err := net.Listen("tcp", location)
	if err != nil {
		log.Fatal(err)
	}

	if !opts.Server {
		open("http://localhost" + location)
	}

	fmt.Println("Starting server..")

	startServer(listener)
}

type Dataset struct {
	Filename   string
	NumSpectra int

	wavenumbers []float64
	data        [][]float64
}

// ListDatasets returns a list of known datasets as JSON
func ListDatasets(w http.ResponseWriter, req *http.Request) {
	dets, _ := json.Marshal(datasets)
	w.Write(dets)
}

func GetData(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)

	if vars["dataid"] != "" {
		if dataset, ok := datasets[vars["dataid"]]; ok {
			w.Header().Set("Content-Type", "application/octet-stream")
			w.Write(float64ToByte(dataset.data[0]))
		} else {
			response := "Dataset with ID " + vars["dataid"] + " not found"
			http.Error(w, response, http.StatusNotFound)
		}
	} else {
		response := "Dataset ID not specified"
		http.Error(w, response, http.StatusBadRequest)
	}

}
func GetSpectrum(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)

	if vars["dataid"] != "" && vars["spectrumid"] != "" {
		if dataset, ok := datasets[vars["dataid"]]; ok {
			spectrumIndex, err := strconv.ParseInt(vars["spectrumid"], 10, 32)
			if err != nil {
				response := "Dataset with spectrum ID " + vars["spectrumid"] + " not found"
				http.Error(w, response, http.StatusNotFound)
			}

			w.Header().Set("Content-Type", "application/octet-stream")
			w.Write(float64ToByte(dataset.data[spectrumIndex]))
		} else {
			response := "Dataset with ID " + vars["dataid"] + " not found"
			http.Error(w, response, http.StatusNotFound)
		}
	} else {
		response := "Dataset ID not specified"
		http.Error(w, response, http.StatusBadRequest)
	}

}

func float64ToByte(floats []float64) []byte {
	var buf bytes.Buffer

	for _, f := range floats {
		//err := binary.Write(&buf, binary.BigEndian, f)
		err := binary.Write(&buf, binary.LittleEndian, f)

		if err != nil {
			fmt.Printf("binary.Write failed: (%f) %s", f, err)
			break
		}
	}

	return buf.Bytes()
}

var datasets map[string]*Dataset

func loadFolder(location string) error {
	datasets = make(map[string]*Dataset)

	err := filepath.Walk(location, func(currentPath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		filename := filepath.Base(currentPath)

		if matched, err := filepath.Match("*.txt", filepath.Base(currentPath)); err != nil {
			return err
		} else if matched {
			var dataset Dataset
			dataset.Filename = filename

			csvfile, err := os.Open(currentPath)

			if err != nil {
				return err
			}
			defer csvfile.Close()

			reader := csv.NewReader(csvfile)
			reader.Comma = '\t'
			fields, err := reader.ReadAll()

			startIndex := 0
			for ; fields[0][startIndex] == ""; startIndex++ {
			}
			dataset.wavenumbers = make([]float64, len(fields[0])-startIndex)

			for i := startIndex; i < len(fields[0]); i++ {
				dataset.wavenumbers[i-startIndex], err = strconv.ParseFloat(fields[0][i], 64)
				if err != nil {
					return err
				}
			}

			dataset.data = make([][]float64, len(fields)-1)

			for line := 1; line < len(fields); line++ {
				dataset.data[line-1] = make([]float64, len(fields[0])-startIndex)

				for i := startIndex; i < len(fields[0]); i++ {
					dataset.data[line-1][i-startIndex], err = strconv.ParseFloat(fields[line][i], 64)
					if err != nil {
						return err
					}
				}
			}

			dataset.NumSpectra = len(dataset.data)
			datasets[filename] = &dataset

			return err
		}

		if matched, err := filepath.Match("*.csv", filepath.Base(currentPath)); err != nil {
			return err
		} else if matched {

		}

		return nil
	})

	return err
}
