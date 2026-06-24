/**
 * WordPress dependencies
 */
import { DataViewsPicker, filterSortAndPaginate } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { createDashboardWidget } from '../../utils/create-dashboard-widget';
import { WidgetPreviewChrome } from '../widget-preview-chrome';
import { PreviewSizeControl } from './preview-size-control';

const DEFAULT_VIEW: View = {
	type: 'pickerGrid',
	page: 1,
	search: '',
	mediaField: 'preview',
	titleField: 'title',
	// Larger tile than the 230 default; scale is 120/170/230/290/350/430.
	layout: { previewSize: 290 },
};

const getItemId = ( item: WidgetType ) => item.name;

function WidgetPreview( { item }: { item: WidgetType } ) {
	const exampleWidget = useMemo(
		() => createDashboardWidget( item, item.example?.attributes ),
		[ item ]
	);

	return <WidgetPreviewChrome widget={ exampleWidget } widgetType={ item } />;
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
	const layout = view.layout as { previewSize?: number } | undefined;
	const previewSize = layout?.previewSize ?? 290;

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
		>
			{ /* Custom toolbar: search left, size right (no view-config cog). */ }
			<Stack
				direction="row"
				align="top"
				justify="space-between"
				className="dataviews__view-actions"
				gap="xs"
			>
				<Stack
					direction="row"
					gap="sm"
					justify="start"
					className="dataviews__search"
				>
					<DataViewsPicker.Search />
				</Stack>
				<Stack
					direction="row"
					align="center"
					style={ { flexShrink: 0 } }
				>
					<PreviewSizeControl
						value={ previewSize }
						onChange={ ( next ) =>
							setView(
								( current ) =>
									( {
										...current,
										layout: {
											...current.layout,
											previewSize: next,
										},
									} ) as View
							)
						}
					/>
				</Stack>
			</Stack>
			<DataViewsPicker.Layout />
			<DataViewsPicker.Footer />
		</DataViewsPicker>
	);
}
