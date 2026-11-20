import type { ReactNode } from 'react';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import { inertValue } from '@wordpress/react-inert-value';
import {
	chevronDownSmall,
	chevronLeftSmall,
	chevronRightSmall,
} from '@wordpress/icons';

function getToggleIcon( isExpanded?: boolean ) {
	if ( isExpanded ) {
		return chevronDownSmall;
	}
	return isRTL() ? chevronLeftSmall : chevronRightSmall;
}

interface HierarchyCellProps {
	level: number;
	label: string;
	hasChildren?: boolean;
	isExpanded?: boolean;
	onToggle: () => void;
	checkbox: ReactNode;
	children: ReactNode;
}

/**
 * The first cell of a tree row: the disclosure button, the row's selection
 * checkbox, and the cell content.
 *
 * @param props             Component props.
 * @param props.level       The row's depth, starting at 0.
 * @param props.label       The item's label, used in the button label.
 * @param props.hasChildren Whether the row can expand.
 * @param props.isExpanded  Whether the row is expanded.
 * @param props.onToggle    Called when the disclosure button is pressed.
 * @param props.checkbox    The row's selection checkbox, if any.
 * @param props.children    The cell content.
 */
export function HierarchyCell( {
	level,
	label,
	hasChildren,
	isExpanded,
	onToggle,
	checkbox,
	children,
}: HierarchyCellProps ) {
	return (
		<div className="dataviews-view-table__hierarchy-cell">
			{ level > 0 && (
				<VisuallyHidden render={ <span /> }>
					{ sprintf(
						// translators: %d: The hierarchy level number.
						__( 'Hierarchy level %d' ),
						level + 1
					) }
				</VisuallyHidden>
			) }
			<span className="dataviews-view-table__hierarchy-toggle-slot">
				{ hasChildren && (
					<Button
						className="dataviews-view-table__hierarchy-toggle"
						icon={ getToggleIcon( isExpanded ) }
						label={
							isExpanded
								? sprintf(
										// translators: %s: The item title.
										__( 'Collapse %s' ),
										label
									)
								: sprintf(
										// translators: %s: The item title.
										__( 'Expand %s' ),
										label
									)
						}
						aria-expanded={ isExpanded }
						onClick={ onToggle }
						size="compact"
					/>
				) }
			</span>
			{ checkbox }
			{ children }
		</div>
	);
}

interface HierarchyHeaderCellProps {
	isAllExpanded: boolean;
	onToggleAll?: () => void;
	isCovered: boolean;
	checkbox: ReactNode;
	children: ReactNode;
}

/**
 * The first header cell of a tree table: Expand all or Collapse all, then
 * Select all, then the column header.
 *
 * @param props               Component props.
 * @param props.isAllExpanded Whether every loaded parent is expanded.
 * @param props.onToggleAll   Toggles every loaded parent. Omit when no row can expand.
 * @param props.isCovered     Whether the bulk actions toolbar covers Select all.
 * @param props.checkbox      The Select all checkbox, if any.
 * @param props.children      The column header.
 */
export function HierarchyHeaderCell( {
	isAllExpanded,
	onToggleAll,
	isCovered,
	checkbox,
	children,
}: HierarchyHeaderCellProps ) {
	return (
		<div className="dataviews-view-table__hierarchy-cell">
			{ onToggleAll && (
				<Button
					className="dataviews-view-table__hierarchy-toggle"
					icon={ getToggleIcon( isAllExpanded ) }
					label={
						isAllExpanded
							? __( 'Collapse all' )
							: __( 'Expand all' )
					}
					onClick={ onToggleAll }
					size="compact"
				/>
			) }
			{ /* The bulk actions toolbar covers Select all, like the
			checkbox column in a flat table. */ }
			<div
				className="dataviews-view-table__hierarchy-header-controls"
				inert={ inertValue( isCovered ) }
				aria-hidden={ isCovered || undefined }
			>
				{ checkbox }
			</div>
			{ children }
		</div>
	);
}

/**
 * Returns where the bulk actions toolbar starts, in pixels from the header's
 * inline start. A tree header puts Expand all before Select all, so the
 * toolbar starts at Select all: its checkbox lands in the same place and
 * Expand all stays uncovered. Returns `undefined` outside a tree header.
 *
 * @param header   The table header.
 * @param checkbox The header's Select all checkbox.
 */
export function getHierarchyBulkActionsStart(
	header: HTMLElement,
	checkbox: HTMLElement | null
): number | undefined {
	if ( ! checkbox?.closest( '.dataviews-view-table__hierarchy-cell' ) ) {
		return undefined;
	}
	const headerRect = header.getBoundingClientRect();
	const checkboxRect = checkbox.getBoundingClientRect();
	return isRTL()
		? headerRect.right - checkboxRect.right
		: checkboxRect.left - headerRect.left;
}
