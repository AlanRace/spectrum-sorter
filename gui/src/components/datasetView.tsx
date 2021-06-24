import * as React from 'react'
import { Dataset } from '../dataset'

export interface DatasetViewProps {
    datasetToView: Dataset

    width: number
    height: number

}
export interface DatasetViewState {
    datasetToView: Dataset
    isInitialised: boolean

    error: any
}

class DatasetView extends React.Component<DatasetViewProps, DatasetViewState> {
    canvas: HTMLCanvasElement

    updateProcessTimer: number

    mouseDownOnCanvas: boolean = false;

    constructor(props: DatasetViewProps) {
        super(props);

        this.state = {
            datasetToView: props.datasetToView,
            isInitialised: false,

            error: null
        }

        // This binding is necessary to make `this` work in the callback    
        this.redrawCanvas = this.redrawCanvas.bind(this);
    }

    componentDidMount() {
        this.setDataset(this.props.datasetToView)
    }

    componentDidUpdate() {
        if (this.state.datasetToView != this.props.datasetToView) {
            this.setDataset(this.props.datasetToView)
        } else {
            this.redrawCanvas()
        }
    }


    setDataset(dataset: Dataset) {
        this.setState({
            datasetToView: dataset,
        })
    }

    redrawCanvas() {
        let context = this.canvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        context.imageSmoothingEnabled = false;

        context.save();

        this.state.datasetToView.getData().then(data => {
            let minValue = data[0];
            let maxValue = data[0];

            data.forEach((value) => {
                if(minValue > value) {
                    minValue = value
                }
                if(maxValue < value) {
                    maxValue = value
                }
            })

            let widthPerPoint = this.canvas.width / data.length;
            let xPosition = 0;

            context.beginPath();
            context.moveTo(xPosition, this.canvas.height - (data[0] / maxValue * this.canvas.height))

            data.forEach((value) => {
                context.lineTo(xPosition, this.canvas.height - (value / maxValue * this.canvas.height))

                xPosition += widthPerPoint
            })

            context.stroke();
            
        })

        

        context.restore();
    }

    render() {
        return (
            <div style={{ display: "flex" }}>
                <canvas
                    width={this.props.width}
                    height={this.props.height}
                    style={{ width: this.props.width + 'px', height: this.props.height + 'px' }}
                    ref={(ref) => { this.canvas = ref }}
                ></canvas>
            </div>
        )
    }
}

export default DatasetView