/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import { VIEW_LAYOUTS } from '../../dataviews-layouts';
import type { DataViewsPickerView, ViewPickerBaseProps } from '../../types';

type DataViewsLayoutProps = {
	className?: string;
	label?: string;
};

export default function DataViewsPickerLayout( {
	className,
	label,
}: DataViewsLayoutProps ) {
	const {
		actions = [],
		data,
		fields,
		getItemId,
		getItemLevel,
		isLoading,
		view,
		onChangeView,
		selection,
		onChangeSelection,
		setOpenedFilter,
		empty = __( 'No results' ),
	} = useContext( DataViewsContext );

	const ViewComponent = VIEW_LAYOUTS.filter( ( v ) => v.isPicker ).find(
		( v ) => v.type === view.type
	)?.component as ComponentType< ViewPickerBaseProps< any > >;

	return (
		<ViewComponent
			className={ className }
			actions={ actions }
			data={ data }
			fields={ fields }
			getItemId={ getItemId }
			getItemLevel={ getItemLevel }
			isLoading={ isLoading }
			onChangeView={ onChangeView }
			onChangeSelection={ onChangeSelection }
			selection={ selection }
			setOpenedFilter={ setOpenedFilter }
			view={ view as DataViewsPickerView }
			empty={ empty }
			label={ label }
		/>
	);
}
