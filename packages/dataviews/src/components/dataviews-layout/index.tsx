/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import { VIEW_LAYOUTS } from '../dataviews-layouts';
import { useDelayedLoading } from '../../hooks/use-delayed-loading';
import type { ViewBaseProps } from '../../types';

type DataViewsLayoutProps = {
	className?: string;
};

export default function DataViewsLayout( { className }: DataViewsLayoutProps ) {
	const {
		actions = [],
		data,
		fields,
		getItemId,
		getItemLevel,
		hasInitiallyLoaded,
		isLoading,
		view,
		onChangeView,
		selection,
		onChangeSelection,
		setOpenedFilter,
		onClickItem,
		isItemClickable,
		renderItemLink,
		defaultLayouts,
		containerRef,
		empty = <p>{ __( 'No results' ) }</p>,
	} = useContext( DataViewsContext );

	const isDelayedInitialLoading = useDelayedLoading( ! hasInitiallyLoaded, {
		delay: 200,
	} );
	// Until the initial data load completes, show a spinner (or nothing if fast).
	// After that, render the layout component which preserves previous data
	// while loading subsequent requests.
	if ( ! hasInitiallyLoaded ) {
		// If the initial data load is fast, don't show the loading state at all.
		if ( ! isDelayedInitialLoading ) {
			return null;
		}
		// If the initial data load takes more than 200ms, show the loading state.
		return (
			<div className="dataviews-loading">
				<p>
					<Spinner />
				</p>
			</div>
		);
	}

	const ViewComponent = VIEW_LAYOUTS.find(
		( v ) => v.type === view.type && defaultLayouts[ v.type ]
	)?.component as ComponentType< ViewBaseProps< any > >;

	return (
		<div className="dataviews-layout__container" ref={ containerRef }>
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
				onClickItem={ onClickItem }
				renderItemLink={ renderItemLink }
				isItemClickable={ isItemClickable }
				view={ view }
				empty={ empty }
			/>
		</div>
	);
}
