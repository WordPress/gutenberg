import type { CSSProperties } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import type { HierarchyPaginationInfo } from '../../../types';

interface HierarchyPaginationRowProps {
	columnCount: number;
	level: number;
	parentId: string | null;
	parentLabel?: string;
	previousRowId?: string;
	paginationInfo: HierarchyPaginationInfo;
	onLoadMore: ( parentId: string | null ) => void;
	moveFocus: ( previousRowId?: string ) => void;
}

export default function HierarchyPaginationRow( {
	columnCount,
	level,
	parentId,
	parentLabel,
	previousRowId,
	paginationInfo,
	onLoadMore,
	moveFocus,
}: HierarchyPaginationRowProps ) {
	const error =
		typeof paginationInfo.error === 'string' && paginationInfo.error
			? paginationInfo.error
			: undefined;
	const isRetry = !! error;
	const hasFocusRef = useRef( false );
	const requestedPositionRef = useRef< { previousRowId?: string } >(
		undefined
	);
	const restoreFocus = useEvent( () => {
		moveFocus(
			requestedPositionRef.current
				? requestedPositionRef.current.previousRowId
				: previousRowId
		);
	} );
	useEffect(
		() => () => {
			if ( hasFocusRef.current ) {
				window.requestAnimationFrame( restoreFocus );
			}
		},
		[ restoreFocus ]
	);
	const remainingItems = paginationInfo.remainingItems;
	const hasRemainingItems =
		typeof remainingItems === 'number' &&
		Number.isInteger( remainingItems ) &&
		remainingItems >= 0;
	let buttonText: string = __( 'Load more' );
	let buttonLabel;
	if ( paginationInfo.isLoading ) {
		buttonText = __( 'Loading…' );
		buttonLabel = parentLabel
			? sprintf(
					/* translators: %s: The parent item title. */
					__( 'Loading children of %s' ),
					parentLabel
				)
			: __( 'Loading items' );
	} else if ( isRetry ) {
		buttonText = __( 'Retry' );
		buttonLabel = parentLabel
			? sprintf(
					/* translators: %s: The parent item title. */
					__( 'Retry loading children of %s' ),
					parentLabel
				)
			: __( 'Retry loading items' );
	} else if ( hasRemainingItems ) {
		buttonText = sprintf(
			/* translators: %d: Total number of remaining items at this level. */
			_n( 'Show %d more', 'Show %d more', remainingItems ),
			remainingItems
		);
		buttonLabel = parentLabel
			? sprintf(
					/* translators: 1: Number of remaining children, 2: The parent item title. */
					_n(
						'Show %1$d more child of %2$s',
						'Show %1$d more children of %2$s',
						remainingItems
					),
					remainingItems,
					parentLabel
				)
			: sprintf(
					/* translators: %d: Number of remaining items. */
					_n(
						'Show %d more item',
						'Show %d more items',
						remainingItems
					),
					remainingItems
				);
	} else {
		buttonLabel = parentLabel
			? sprintf(
					/* translators: %s: The parent item title. */
					__( 'Load more children of %s' ),
					parentLabel
				)
			: __( 'Load more items' );
	}
	const content = (
		<div className="dataviews-view-table__hierarchy-pagination-content">
			{ error && <span role="alert">{ error }</span> }
			<Button
				variant="tertiary"
				size="compact"
				aria-label={ buttonLabel }
				disabled={ paginationInfo.isLoading }
				accessibleWhenDisabled
				isBusy={ paginationInfo.isLoading }
				aria-busy={ paginationInfo.isLoading }
				onClick={ () => {
					// Keep the pre-request position when data and loading update separately.
					requestedPositionRef.current = { previousRowId };
					onLoadMore( parentId );
				} }
				onFocus={ () => {
					hasFocusRef.current = true;
				} }
				onBlur={ () => {
					hasFocusRef.current = false;
					requestedPositionRef.current = undefined;
				} }
			>
				{ buttonText }
			</Button>
		</div>
	);

	return (
		<tr
			className="dataviews-view-table__hierarchy-pagination-row"
			style={
				{
					'--wp-dataviews-table-hierarchy-level': level,
				} as CSSProperties
			}
		>
			<td
				className="dataviews-view-table__hierarchy-content-column"
				colSpan={ columnCount }
			>
				{ content }
			</td>
		</tr>
	);
}
