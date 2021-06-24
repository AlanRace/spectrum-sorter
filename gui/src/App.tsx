import * as React from "react";
import { lazy, useEffect, useState } from "react"
import { Dataset, Spectrum } from "./dataset"
import DatasetTable from "./components/datasetTable"
import DatasetView from "./components/datasetView"
import SpectrumView from "./components/spectrumView"

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface AppProps {
    //datasets: Map<string, Dataset>
}

interface AppState {
    datasets?: Map<string, Dataset>
    datasetToView?: Dataset
}

let spectrumWidth = 250
let spectrumHeight = 80

 
export function App(props: AppProps) {

    const [datasets, setDatasets] = useState<Map<string, Dataset>>();
    const [datasetToView, setDatasetToView] = useState<Dataset>();
    const [spectrumToView, setSpectrumToView] = useState<Spectrum>();

    // Perform once when first initialising the app: load datasets
    useEffect(() => {
        async function loadDatasets() {
            // Load the dataset list from server
            fetch('/data').then(response => {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                        response.status);
                    return;
                }

                let datasets = new Map<string, Dataset>();

                response.json().then(datasetsJson => {
                    for(let id in datasetsJson) {
                        datasets.set(id, Dataset.fromJSON(datasetsJson[id]));
                    }

                    setDatasets(datasets)
                })
            })
        }

        loadDatasets();
    }, []);

    // selectDataset is a callback when a dataset is selected (for example from the table)
    function selectDataset(dataset: Dataset) {
        setDatasetToView(dataset)
    }

    function onDragEnd(result: any) {
        const { source, destination } = result;
    
        // dropped outside the list
        if (!destination) {
            return;
        }

        console.log(source)
        console.log(destination)
        if(source.droppableId == "unsorted" && destination.droppableId == "toKeep") {
            datasetToView.toKeepSpectra.push(datasetToView.unsortedSpectra[source.index]);
            datasetToView.unsortedSpectra.splice(source.index, 1);
        } else if(source.droppableId == "toKeep" && destination.droppableId == "unsorted") {
            datasetToView.unsortedSpectra.push(datasetToView.toKeepSpectra[source.index]);
            datasetToView.toKeepSpectra.splice(source.index, 1);
        }
    
        /*if (source.droppableId === destination.droppableId) {
            const items = reorder(
                this.getList(source.droppableId),
                source.index,
                destination.index
            );
    
            let state = { items };
    
            if (source.droppableId === 'droppable2') {
                state = { selected: items };
            }
    
            this.setState(state);
        } else {
            const result = move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination
            );
    
            this.setState({
                items: result.droppable,
                selected: result.droppable2
            });
        }*/
    };
    

    if(datasetToView) {
        return (
            <React.Suspense fallback='Loading data...'>
                <div className={"root"}>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="unsorted">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}>
                                <h3>To Keep</h3>
                            {datasetToView.unsortedSpectra.map((spectrum, index) => (
                                <Draggable
                                    key={spectrum.index}
                                    draggableId={"spectrum-" + spectrum.index}
                                    index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )} onClick={()=>{setSpectrumToView(spectrum)}}>
                                            <SpectrumView key={index} spectrumToView={spectrum} width={spectrumWidth} height={spectrumHeight}></SpectrumView>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <div style={{position: "fixed", top: 50, left: 400}}>
                    <SpectrumView spectrumToView={spectrumToView} width={spectrumWidth*4} height={spectrumHeight*5}></SpectrumView>
                </div>
                <Droppable droppableId="toKeep">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}>
                            <h3>To Discard</h3>
                            {datasetToView.toKeepSpectra.map((spectrum, index) => (
                                <Draggable
                                    key={spectrum.index}
                                    draggableId={"spectrum-" + spectrum.index}
                                    index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )}>
                                            <SpectrumView key={index} spectrumToView={spectrum} width={spectrumWidth} height={spectrumHeight}></SpectrumView>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            </div>
            <DatasetView datasetToView={datasetToView} width={700} height={500}></DatasetView>
            <div className="spectrum-list">
                {
                    Array.from(datasetToView.unsortedSpectra).map((spectrum, index) => {
                        return (
                            <SpectrumView key={index} spectrumToView={spectrum} width={100} height={100}></SpectrumView>
                        )
                    })
                }
                
            </div>
            <DatasetTable datasets={datasets} onDatasetSelected={selectDataset}></DatasetTable>
            </React.Suspense>
        );
    } else {
        return (
            <React.Suspense fallback='Loading data...'>
            <DatasetTable datasets={datasets} onDatasetSelected={selectDataset}></DatasetTable>
            </React.Suspense>
        );
    }
    
}

const grid = 8;

const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'white',

    // styles we need to apply on draggables
    ...draggableStyle
});


const getListStyle = (isDraggingOver:boolean) => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    width: spectrumWidth + 20
});
