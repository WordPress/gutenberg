/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';
import i18n from '@wordpress/dataviews-i18n';
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
import ViewActivity from './activity';
import ViewPickerGrid from './picker-grid';
import ViewPickerTable from './picker-table';
import ViewPickerActivity from './picker-activity';
import {
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LAYOUT_ACTIVITY,
	LAYOUT_PICKER_GRID,
	LAYOUT_PICKER_TABLE,
	LAYOUT_PICKER_ACTIVITY,
} from '../../constants';
import DensityPicker from './utils/density-picker';
import GridConfigOptions from './utils/grid-config-options';

export const VIEW_LAYOUTS = [
	{
		type: LAYOUT_TABLE,
		label: i18n.TABLE(),
		component: ViewTable,
		icon: blockTable,
		viewConfigOptions: DensityPicker,
	},
	{
		type: LAYOUT_GRID,
		label: i18n.GRID(),
		component: ViewGrid,
		icon: category,
		viewConfigOptions: GridConfigOptions,
	},
	{
		type: LAYOUT_LIST,
		label: i18n.LIST(),
		component: ViewList,
		icon: isRTL() ? formatListBulletsRTL : formatListBullets,
		viewConfigOptions: DensityPicker,
	},
	{
		type: LAYOUT_ACTIVITY,
		label: i18n.ACTIVITY(),
		component: ViewActivity,
		icon: scheduled,
		viewConfigOptions: DensityPicker,
	},
	{
		type: LAYOUT_PICKER_GRID,
		label: i18n.GRID(),
		component: ViewPickerGrid,
		icon: category,
		viewConfigOptions: GridConfigOptions,
		isPicker: true,
	},
	{
		type: LAYOUT_PICKER_TABLE,
		label: i18n.TABLE(),
		component: ViewPickerTable,
		icon: blockTable,
		viewConfigOptions: DensityPicker,
		isPicker: true,
	},
	{
		type: LAYOUT_PICKER_ACTIVITY,
		label: i18n.ACTIVITY(),
		component: ViewPickerActivity,
		icon: scheduled,
		viewConfigOptions: DensityPicker,
		isPicker: true,
	},
];
