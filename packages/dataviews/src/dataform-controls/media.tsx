/**
 * Internal dependencies
 */
import type {
	DataFormControlProps,
	DataFormControlConfigMedia,
	View,
} from '../types';
import DataViewsPicker from '../components/dataviews-picker';
import { LAYOUT_PICKER_GRID, LAYOUT_PICKER_TABLE } from '../constants';

const EMPTY_ARRAY: string[] = [];
const NOOP = () => {};

export default function Media< Item >( {
	config,
}: DataFormControlProps< Item > ) {
	const mediaConfig = config as DataFormControlConfigMedia;
	const {
		view,
		onChangeView,
		fields,
		data,
		actions,
		selection = EMPTY_ARRAY,
		onChangeSelection = NOOP,
		paginationInfo,
		isLoading,
		getItemId,
	} = mediaConfig;

	return (
		<DataViewsPicker
			getItemId={ getItemId }
			actions={ actions }
			selection={ selection }
			onChangeSelection={ onChangeSelection }
			paginationInfo={ paginationInfo }
			data={ data }
			isLoading={ isLoading }
			fields={ fields }
			view={ view as View }
			onChangeView={ onChangeView as ( view: View ) => void }
			itemListLabel="Media"
			defaultLayouts={ {
				[ LAYOUT_PICKER_GRID ]: {},
				[ LAYOUT_PICKER_TABLE ]: { perPage: 20 },
			} }
		/>
	);
}
