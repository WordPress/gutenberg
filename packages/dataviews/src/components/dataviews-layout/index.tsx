import type { ComponentType } from 'react';
import { useContext } from '@wordpress/element';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import DataViewsContext from '../dataviews-context';
import { VIEW_LAYOUTS } from '../dataviews-layouts';
import { useDelayedLoading } from '../../hooks/use-delayed-loading';
import type { View, ViewBaseProps } from '../../types';

type DataViewsLayoutProps = {
	className?: string;
};

/**
 * Whether the view asks for a page that does not exist — before the first
 * one or past the last one — so an empty result does not mean there is no
 * data for the current query.
 *
 * @param view                      The current view.
 * @param paginationInfo            The totals reported by the consumer.
 * @param paginationInfo.totalPages The total number of pages, if known.
 * @return Whether the current page is out of bounds.
 */
function isPageOutOfBounds(
	view: View,
	paginationInfo: { totalPages: number | null }
): boolean {
	const page = view.page ?? 1;
	if ( page < 1 ) {
		return true;
	}
	const { totalPages } = paginationInfo;
	// Totals are unknown when a request for a page past the last one is
	// rejected, e.g. the REST API answers with an error instead of the
	// (empty) collection and its totals. The first page always exists.
	if ( totalPages === null || totalPages === undefined ) {
		return page > 1;
	}
	// There is always a first page, even when there are no items.
	return page > Math.max( totalPages, 1 );
}

function DefaultEmpty() {
	const { view, onChangeView, paginationInfo } =
		useContext( DataViewsContext );

	if ( ! isPageOutOfBounds( view, paginationInfo ) ) {
		return <p>{ __( 'No results' ) }</p>;
	}

	return (
		<Stack direction="column" align="center" gap="xs">
			<p>{ __( 'No results on this page' ) }</p>
			<Button
				variant="link"
				onClick={ () => onChangeView( { ...view, page: 1 } ) }
			>
				{ __( 'Go to the first page' ) }
			</Button>
		</Stack>
	);
}

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
		empty = <DefaultEmpty />,
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
