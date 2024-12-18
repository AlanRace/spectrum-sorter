
import * as React from 'react'
import { Dataset } from '../dataset'

export interface DatasetTableProps {
    datasets: Map<string, Dataset>

    onDatasetSelected?: (dataset: Dataset) => void
}

class DatasetTable extends React.Component<DatasetTableProps> {

    constructor(props: DatasetTableProps) {
        super(props);
    }

    render() {
        if(this.props.datasets) {
            return (
                <table id="datasetTable">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Spectra to Keep</th>
                            <th>Spectra to Discard</th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        Array.from(this.props.datasets).map(([_, value]) => (value)).map((dataset, index) => {
                            return (
                                <tr key={`${dataset.name}`} onClick={(event) => {this.props.onDatasetSelected(this.props.datasets.get(dataset.name))}}>
                                    <td>
                                        {dataset.name}
                                    </td>
                                    <td align={'right'}>
                                        {dataset.spectra.length}
                                    </td>
                                    <td align={'right'}>
                                        {dataset.discardSpectra.length}
                                    </td>
                                </tr>
                            )
                        })
                    }
                    </tbody>
                </table>
            )
        }

        return (
            <span></span>
        )
    }
}

export default DatasetTable