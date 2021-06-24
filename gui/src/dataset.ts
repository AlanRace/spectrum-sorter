export class Spectrum {
    dataset: Dataset
    index: number

    data: Float64Array
    minValue: number
    maxValue: number

    constructor(dataset: Dataset, index: number) {
        this.dataset = dataset;
        this.index = index;
    }

    setData(data: Float64Array) {
        this.data = data;
        this.minValue = data[0];
        this.maxValue = data[0];

        data.forEach((value) => {
            if (this.minValue > value) {
                this.minValue = value
            }
            if (this.maxValue < value) {
                this.maxValue = value
            }
        })
    }
}


export class Dataset {
    name: string

    numSpectra: number
    data: Float64Array

    unsortedSpectra: Spectrum[]
    toKeepSpectra: Spectrum[]
    discardSpectra: Spectrum[]

    constructor(name: string) {
        this.name = name;

        this.unsortedSpectra = new Array();
        this.toKeepSpectra = new Array();
        this.discardSpectra = new Array();
    }

    static fromJSON(json: any): Dataset {
        var dataset = new Dataset(json['Filename'])

        dataset.numSpectra = json['NumSpectra']

        dataset.unsortedSpectra = new Array(dataset.numSpectra)

        let promises: Array<Promise<void>> = new Array();

        for (let i = 0; i < dataset.numSpectra; i++) {
            promises.push(dataset.getSpectrum(i).then(spectrum => { dataset.unsortedSpectra[i] = spectrum;}))
        }

        Promise.all(promises);

        return dataset
    }

    getSpectrum(spectrumIndex: number): Promise<Spectrum> {
        return new Promise<Spectrum>(resolve => {
            fetch('/data/' + this.name + "/" + spectrumIndex + "/data").then(res => res.arrayBuffer()).then(result => {
                let spectrum = new Spectrum(this, spectrumIndex);
                spectrum.setData(new Float64Array(result));

                resolve(spectrum)
            })
        })
    }

    getData(): Promise<Float64Array> {
        return new Promise<Float64Array>(resolve => {
            fetch('/data/' + this.name + "/data").then(res => res.arrayBuffer()).then(result => {
                this.data = new Float64Array(result)

                resolve(this.data)
            })
        })
    }
}
