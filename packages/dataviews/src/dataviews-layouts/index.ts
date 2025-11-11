/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	blockTable,
	category,
	formatListBullets,
	formatListBulletsRTL,
	scheduled,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ViewTable from './table';
import ViewGrid from './grid';
import ViewList from './list';
import ViewTimeline from './timeline';
import ViewPickerGrid from './picker-grid';
import ViewPickerTable from './picker-table';
import {
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LAYOUT_TIMELINE,
	LAYOUT_PICKER_GRID,
	LAYOUT_PICKER_TABLE,
} from '../constants';
import PreviewSizePicker from './utils/preview-size-picker';
import DensityPicker from './table/density-picker';

export const VIEW_LAYOUTS = [
	{
		type: LAYOUT_TABLE,
		label: __( 'Table' ),
		component: ViewTable,
		icon: blockTable,
		viewConfigOptions: DensityPicker,
		supports: { sorting: true },
	},
	{
		type: LAYOUT_GRID,
		label: __( 'Grid' ),
		component: ViewGrid,
		icon: category,
		viewConfigOptions: PreviewSizePicker,
		supports: { sorting: true },
	},
	{
		type: LAYOUT_LIST,
		label: __( 'List' ),
		component: ViewList,
		icon: isRTL() ? formatListBulletsRTL : formatListBullets,
		supports: { sorting: true },
	},
	{
		type: LAYOUT_TIMELINE,
		label: __( 'Timeline' ),
		component: ViewTimeline,
		icon: scheduled,
		supports: {},
	},
	{
		type: LAYOUT_PICKER_GRID,
		label: __( 'Grid' ),
		component: ViewPickerGrid,
		icon: category,
		viewConfigOptions: PreviewSizePicker,
		isPicker: true,
		supports: { sorting: true },
	},
	{
		type: LAYOUT_PICKER_TABLE,
		label: __( 'Table' ),
		component: ViewPickerTable,
		icon: blockTable,
		viewConfigOptions: DensityPicker,
		isPicker: true,
		supports: { sorting: true },
	},
];
