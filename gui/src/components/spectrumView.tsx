import * as React from 'react'
import { Spectrum } from '../dataset'

export interface SpectrumViewProps {
    spectrumToView: Spectrum

    width: number
    height: number

}
export interface SpectrumViewState {
    spectrumToView: Spectrum

    error: any
}

class SpectrumView extends React.Component<SpectrumViewProps, SpectrumViewState> {
    canvas: HTMLCanvasElement

    constructor(props: SpectrumViewProps) {
        super(props);

        this.state = {
            spectrumToView: props.spectrumToView,

            error: null
        }

        // This binding is necessary to make `this` work in the callback    
        this.redrawCanvas = this.redrawCanvas.bind(this);
    }

    componentDidMount() {
        this.setDataset(this.props.spectrumToView)
    }

    componentDidUpdate() {
        if (this.state.spectrumToView != this.props.spectrumToView) {
            this.setDataset(this.props.spectrumToView)
        } else {
            this.redrawCanvas()
        }
    }


    setDataset(spectrum: Spectrum) {
        this.setState({
            spectrumToView: spectrum,
        })
    }

    redrawCanvas() {
        if(!this.state.spectrumToView) {
            return
        }

        let context = this.canvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        context.imageSmoothingEnabled = false;

        context.save();

        let spectrum = this.state.spectrumToView
        let data = spectrum.data;

        let specDiff = spectrum.maxValue - spectrum.minValue

        let widthPerPoint = this.canvas.width / data.length;
        let xPosition = 0;

        context.beginPath();
        context.moveTo(xPosition, this.canvas.height - ((data[0] - spectrum.minValue) / specDiff * this.canvas.height))

        data.forEach((value) => {
            context.lineTo(xPosition, this.canvas.height - ((value - spectrum.minValue) / specDiff * this.canvas.height))

            xPosition += widthPerPoint
        })

        context.stroke();



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

export default SpectrumView