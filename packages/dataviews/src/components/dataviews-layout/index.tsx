import type { ComponentType, ReactNode } from 'react';
import { useContext, useEffect, useState } from '@wordpress/element';
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

function isOutOfBoundsPage( {
	page,
	totalItems,
	totalPages,
}: {
	page?: number;
	totalItems?: number | null;
	totalPages?: number | null;
} ) {
	const currentPage = page ?? 1;
	if ( currentPage <= 1 ) {
		return false;
	}

	const knownTotalItems = totalItems ?? 0;
	const knownTotalPages = totalPages ?? 0;

	// Known pagination: the requested page is past the last page.
	if ( knownTotalItems > 0 && knownTotalPages > 0 ) {
		return currentPage > knownTotalPages;
	}

	// Unknown/zero totals after load (e.g. REST rejected an out-of-bounds page
	// and no totals were received). Offer recovery via the first page.
	return knownTotalItems === 0 && knownTotalPages === 0;
}

function DefaultEmpty( {
	page,
	totalItems,
	totalPages,
	isLoading,
	hasData,
	view,
	onChangeView,
}: {
	page?: number;
	totalItems?: number | null;
	totalPages?: number | null;
	isLoading?: boolean;
	hasData: boolean;
	view: View;
	onChangeView: ( view: View ) => void;
} ): ReactNode {
	const [ isNavigatingToFirstPage, setIsNavigatingToFirstPage ] =
		useState( false );

	useEffect( () => {
		if ( ! isNavigatingToFirstPage ) {
			return;
		}

		if ( hasData ) {
			setIsNavigatingToFirstPage( false );
			return;
		}

		if ( ( page ?? 1 ) !== 1 ) {
			return;
		}

		// Keep the empty state blank while a resolver is in flight.
		if ( isLoading ) {
			return;
		}

		// Wait briefly so a just-started request can mark itself loading
		// before we fall back to the generic empty copy.
		const timeoutId = window.setTimeout( () => {
			setIsNavigatingToFirstPage( false );
		}, 100 );

		return () => window.clearTimeout( timeoutId );
	}, [ hasData, isLoading, isNavigatingToFirstPage, page ] );

	// Avoid flashing "No results" while navigating back to a valid page.
	if ( isLoading || isNavigatingToFirstPage ) {
		return null;
	}

	if (
		! isOutOfBoundsPage( {
			page,
			totalItems,
			totalPages,
		} )
	) {
		return <p>{ __( 'No results' ) }</p>;
	}

	return (
		<Stack direction="column" align="center" justify="center" gap="xs">
			<p>{ __( 'No results on this page' ) }</p>
			<Button
				variant="link"
				onClick={ () => {
					setIsNavigatingToFirstPage( true );
					onChangeView( {
						...view,
						page: 1,
					} );
				} }
			>
				{ __( 'Go to first page' ) }
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
		paginationInfo,
		empty,
	} = useContext( DataViewsContext );

	const resolvedEmpty = empty ?? (
		<DefaultEmpty
			page={ view.page }
			totalItems={ paginationInfo.totalItems }
			totalPages={ paginationInfo.totalPages }
			isLoading={ isLoading }
			hasData={ data.length > 0 }
			view={ view }
			onChangeView={ onChangeView }
		/>
	);

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
				empty={ resolvedEmpty }
			/>
		</div>
	);
}
