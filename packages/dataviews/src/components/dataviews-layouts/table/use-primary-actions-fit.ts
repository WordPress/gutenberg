import { useResizeObserver } from '@wordpress/compose';

/**
 * Fits the primary actions next to the title, without them changing the
 * width of the primary column. See `.dataviews-view-table__title-row` in the
 * stylesheet for the CSS half of this.
 *
 * The stylesheet caps the actions to the room the row has left after a
 * minimum of title, using the widths this writes to custom properties, and
 * actions that don't fit wrap. The width of their longest line is what the
 * title makes room for when they're revealed. The width of all the actions on
 * one line is the room the row reserves for them.
 *
 * @param titleRow The title row, holding the title and the primary actions.
 */
function fitPrimaryActions( titleRow: HTMLElement ) {
	const title = titleRow.querySelector( ':scope > .dataviews-title-field' );
	const content = titleRow.querySelector< HTMLElement >(
		'.dataviews-view-table__primary-actions-content'
	);
	if ( ! title || ! content ) {
		return;
	}

	// A range spans the whole title text, even where the title is elided.
	const range = titleRow.ownerDocument.createRange();
	range.selectNodeContents( title );
	titleRow.style.setProperty(
		'--wp-dataviews-title-row-width',
		`${ titleRow.clientWidth }px`
	);
	titleRow.style.setProperty(
		'--wp-dataviews-title-width',
		`${ range.getBoundingClientRect().width }px`
	);

	const box = content.getBoundingClientRect();
	const style = getComputedStyle( content );
	const isRtl = style.direction === 'rtl';
	const gap = parseFloat( style.columnGap ) || 0;
	let actionsWidth = 0;
	let unwrappedWidth = parseFloat( style.paddingInlineStart ) || 0;
	Array.from( content.children ).forEach( ( action, index ) => {
		const rect = action.getBoundingClientRect();
		const end = isRtl ? box.right - rect.left : rect.right - box.left;
		actionsWidth = Math.max( actionsWidth, end );
		unwrappedWidth += rect.width + ( index > 0 ? gap : 0 );
	} );
	titleRow.style.setProperty(
		'--wp-dataviews-primary-actions-unwrapped-width',
		`${ unwrappedWidth }px`
	);
	titleRow.style.setProperty(
		'--wp-dataviews-primary-actions-width',
		`${ actionsWidth }px`
	);
}

/**
 * Returns the refs for the title row and the primary actions content.
 */
export function usePrimaryActionsFit() {
	const titleRowRef = useResizeObserver( ( [ entry ] ) =>
		fitPrimaryActions( entry.target as HTMLElement )
	);
	const primaryActionsRef = useResizeObserver( ( [ entry ] ) => {
		const titleRow = entry.target.closest< HTMLElement >(
			'.dataviews-view-table__title-row'
		);
		if ( titleRow ) {
			fitPrimaryActions( titleRow );
		}
	} );
	return { titleRowRef, primaryActionsRef };
}
