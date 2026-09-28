import DensityPicker from './density-picker';
import MediaFitControl from './media-fit-control';
import PreviewSizePicker from './preview-size-picker';

export default function GridConfigOptions() {
	return (
		<>
			<DensityPicker />
			<MediaFitControl />
			<PreviewSizePicker />
		</>
	);
}
