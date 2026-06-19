/**
 * WordPress dependencies
 */
import { DataViewsPicker, filterSortAndPaginate } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import { Suspense, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { createDashboardWidget } from '../../utils/create-dashboard-widget';
import { WidgetRender } from '../widget-render';
import styles from './widget-picker.module.css';

const DEFAULT_VIEW: View = {
	type: 'pickerGrid',
	page: 1,
	search: '',
	mediaField: 'preview',
	titleField: 'title',
};

const getItemId = ( item: WidgetType ) => item.name;

function WidgetPreview( { item }: { item: WidgetType } ) {
	const exampleWidget = useMemo(
		() => createDashboardWidget( item, item.example?.attributes ),
		[ item ]
	);

	return (
		<div className={ styles.preview } { ...{ inert: '' } }>
			<Suspense fallback={ null }>
				<WidgetRender widget={ exampleWidget } widgetType={ item } />
			</Suspense>
		</div>
	);
}

const fields: Field< WidgetType >[] = [
	{
		id: 'title',
		type: 'text',
		label: __( 'Title' ),
		filterBy: false,
	},
	{
		id: 'preview',
		type: 'media',
		render: WidgetPreview,
	},
	{
		id: 'name',
		type: 'text',
		enableGlobalSearch: true,
		enableHiding: false,
		enableSorting: false,
		filterBy: false,
		getValue: ( { item } ) =>
			`${ item.name.replace( /[\/,\-_]/g, ' ' ) } ${ item.title }`,
	},
];

interface WidgetPickerProps {
	/**
	 * Called with the widget types selected by the user. The picker keeps
	 * its own selection state; consumers receive the resolved list when
	 * the "Select" action fires.
	 */
	onSelect: ( widgetTypes: WidgetType[] ) => void;

	/**
	 * Accessible label for the picker's item list.
	 *
	 * @default __( 'Widget list' )
	 */
	itemListLabel?: string;
}

/**
 * DataViews-driven widget type picker. Lists `widgetTypes` from the dashboard
 * context as a grid of live previews, supports search via `name`/`title`, and
 * exposes a single "Select" action with bulk support so users can insert one
 * or several widgets at once.
 *
 * @param {WidgetPickerProps} props Component props.
 */
export function WidgetPicker( {
	onSelect,
	itemListLabel = __( 'Widget list' ),
}: WidgetPickerProps ) {
	const { widgetTypes: registeredTypes } = useDashboardInternalContext();
	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	const { data: widgetTypes } = filterSortAndPaginate(
		registeredTypes,
		view,
		fields
	);

	const actions = useMemo(
		() => [
			{
				id: 'select',
				label: __( 'Select' ),
				isPrimary: true,
				supportsBulk: true,
				callback: ( items: WidgetType[] ) => onSelect( items ),
			},
		],
		[ onSelect ]
	);

	return (
		<DataViewsPicker
			data={ widgetTypes }
			fields={ fields }
			view={ view }
			actions={ actions }
			defaultLayouts={ { pickerGrid: {} } }
			onChangeView={ setView }
			isLoading={ false }
			paginationInfo={ {
				totalItems: widgetTypes.length,
				totalPages: 1,
			} }
			selection={ selection }
			onChangeSelection={ setSelection }
			getItemId={ getItemId }
			itemListLabel={ itemListLabel }
		/>
	);
}
