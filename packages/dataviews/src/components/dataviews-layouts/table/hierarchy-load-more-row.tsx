import { __, _n, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import type { HierarchyPaginationInfo } from '../../../types';

interface HierarchyLoadMoreRowProps {
	columnCount: number;
	level: number;
	parentId: string | null;
	parentLabel?: string;
	previousRowId?: string;
	paginationInfo: HierarchyPaginationInfo;
	onLoadMore: ( parentId: string | null ) => void;
	moveFocus: ( previousRowId?: string ) => void;
}

export default function HierarchyLoadMoreRow( {
	columnCount,
	level,
	parentId,
	parentLabel,
	previousRowId,
	paginationInfo,
	onLoadMore,
	moveFocus,
}: HierarchyLoadMoreRowProps ) {
	const { error, isLoading, remainingItems } = paginationInfo;
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
	// The visible text names the level only for root rows, so child rows
	// add the parent to their accessible name.
	let buttonText: string = __( 'Load more' );
	let buttonLabel: string | undefined =
		parentLabel &&
		sprintf(
			/* translators: %s: The parent item title. */
			__( 'Load more children of %s' ),
			parentLabel
		);
	if ( isLoading ) {
		buttonText = __( 'Loading…' );
		buttonLabel =
			parentLabel &&
			sprintf(
				/* translators: %s: The parent item title. */
				__( 'Loading children of %s' ),
				parentLabel
			);
	} else if ( error ) {
		buttonText = __( 'Retry' );
		buttonLabel =
			parentLabel &&
			sprintf(
				/* translators: %s: The parent item title. */
				__( 'Retry loading children of %s' ),
				parentLabel
			);
	} else if ( remainingItems !== undefined ) {
		buttonText = sprintf(
			/* translators: %d: Total number of remaining items at this level. */
			_n( 'Show %d more', 'Show %d more', remainingItems ),
			remainingItems
		);
		buttonLabel =
			parentLabel &&
			sprintf(
				/* translators: 1: Number of remaining children, 2: The parent item title. */
				_n(
					'Show %1$d more child of %2$s',
					'Show %1$d more children of %2$s',
					remainingItems
				),
				remainingItems,
				parentLabel
			);
	}
	return (
		<tr>
			<td colSpan={ columnCount }>
				<div
					className="dataviews-view-table__hierarchy-load-more-content"
					// Line the button up with the children's selection checkboxes.
					style={ {
						paddingInlineStart: `calc(${
							level + 1
						} * var(--wpds-dimension-size-md))`,
					} }
				>
					{ error && <span role="alert">{ error }</span> }
					<Button
						variant="tertiary"
						size="compact"
						aria-label={ buttonLabel }
						disabled={ isLoading }
						accessibleWhenDisabled
						isBusy={ isLoading }
						aria-busy={ isLoading }
						onClick={ () => {
							// Keep the pre-request position when data and loading update separately.
							requestedPositionRef.current = {
								previousRowId,
							};
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
			</td>
		</tr>
	);
}
