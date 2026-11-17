import { useResizeObserver } from '@wordpress/compose';

/**
 * Fits the primary actions next to the title, without them changing the
 * width of the primary column. See `.dataviews-view-table__title-row` in the
 * stylesheet for the CSS half of this.
 *
 * The stylesheet caps the actions to the room the row has left after a
 * minimum of title, using the widths this writes to custom properties. Actions
 * that don't fit wrap out of view: they're hidden, so they can't be focused
 * while invisible, and stay available in the actions menu. The width of the
 * actions that fit is what the title makes room for when they're revealed.
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
	const isRtl = getComputedStyle( content ).direction === 'rtl';
	let firstLineTop: number | undefined;
	let fittingWidth = 0;
	for ( const action of Array.from( content.children ) as HTMLElement[] ) {
		const rect = action.getBoundingClientRect();
		firstLineTop ??= rect.top;
		const end = isRtl ? box.right - rect.left : rect.right - box.left;
		const fits =
			Math.abs( rect.top - firstLineTop ) < 1 && end <= box.width + 0.5;
		action.style.visibility = fits ? '' : 'hidden';
		if ( fits ) {
			fittingWidth = Math.max( fittingWidth, end );
		}
	}
	titleRow.style.setProperty(
		'--wp-dataviews-primary-actions-width',
		`${ fittingWidth }px`
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
