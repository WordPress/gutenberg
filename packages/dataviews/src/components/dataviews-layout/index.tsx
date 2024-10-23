/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import { VIEW_LAYOUTS } from '../../dataviews-layouts';
import type { ViewBaseProps } from '../../types';

export default function DataViewsLayout() {
	const {
		actions = [],
		data,
		fields,
		getItemId,
		isLoading,
		view,
		onChangeView,
		selection,
		onChangeSelection,
		setOpenedFilter,
		density,
		onPinItem,
		onUnpinItem,
		pinnedItems = [],
	} = useContext( DataViewsContext );

	const ViewComponent = VIEW_LAYOUTS.find( ( v ) => v.type === view.type )
		?.component as ComponentType< ViewBaseProps< any > >;

	return (
		<ViewComponent
			actions={ actions }
			data={ data }
			fields={ fields }
			getItemId={ getItemId }
			isLoading={ isLoading }
			onChangeView={ onChangeView }
			onChangeSelection={ onChangeSelection }
			selection={ selection }
			setOpenedFilter={ setOpenedFilter }
			view={ view }
			density={ density }
			onPinItem={ onPinItem }
			onUnpinItem={ onUnpinItem }
			pinnedItems={ pinnedItems }
		/>
	);
}
