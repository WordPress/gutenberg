import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import isLabelOnlySubmenu from '../../navigation-submenu/is-label-only';
import { useActiveSubmenuId } from './use-submenu-appender-parent-ids';

const ROW = '.block-editor-list-view-leaf';

/**
 * Styles for the menu's list view that depend on which blocks are where, so
 * can't live in a stylesheet. The list view is a flat table of rows with no
 * per-block-type class, so rows are targeted by client id.
 *
 * - The sub menu being worked on (#86178) reads as one container: its row,
 *   its items' rows and its add button's row share a tint, edge to edge.
 * - Label-only sub menus (#86936) get text for screen readers after their
 *   name, using CSS alternative text, which is read but not shown. Sighted
 *   people see their own icon instead.
 *
 * Rendered once, by the top-level appender, which every menu list view shows.
 *
 * @param props
 * @param props.navigationClientId Client id of the Navigation block.
 */
export default function NavigationMenuListStyles( {
	navigationClientId,
}: {
	navigationClientId: string;
} ) {
	const activeSubmenuId = useActiveSubmenuId( navigationClientId );
	// Joined so the selector returns primitives.
	const { activeIds, labelOnlyIds } = useSelect(
		( select ) => {
			const {
				getClientIdsOfDescendants,
				getBlockName,
				getBlockAttributes,
			} = select( blockEditorStore );
			const descendants = getClientIdsOfDescendants( navigationClientId );
			return {
				activeIds: activeSubmenuId
					? [
							activeSubmenuId,
							...getClientIdsOfDescendants( activeSubmenuId ),
						].join( ',' )
					: '',
				labelOnlyIds: descendants
					.filter(
						( id ) =>
							getBlockName( id ) === 'core/navigation-submenu' &&
							isLabelOnlySubmenu( getBlockAttributes( id ) )
					)
					.join( ',' ),
			};
		},
		[ navigationClientId, activeSubmenuId ]
	);

	const rules: string[] = [];

	if ( activeIds ) {
		const rows = activeIds
			.split( ',' )
			.map( ( id ) => `${ ROW }[data-block="${ id }"]` );
		const appenderRow = `tr:has([data-navigation-menu-appender-for="${ activeSubmenuId }"])`;
		// On the cells, which is where the list view paints its own row
		// backgrounds (selected, and the faint "in the selected branch"
		// tint), so the submenu's tint wins over that, but not over the
		// selected row's.
		const cells = [ ...rows, appenderRow ].map(
			( row ) => `${ row }:not(.is-selected) > td`
		);
		rules.push(
			`${ cells.join( ',' ) } {
				background-color: var(--wpds-color-background-interactive-neutral-weak-active, #f0f0f0);
			}`,
			`${ rows[ 0 ] } {
				box-shadow: inset 0 1px 0 var(--wpds-color-stroke-surface-neutral, #ddd);
			}`,
			`${ appenderRow } {
				box-shadow: inset 0 -1px 0 var(--wpds-color-stroke-surface-neutral, #ddd);
			}`
		);
	}

	if ( labelOnlyIds ) {
		const titles = labelOnlyIds
			.split( ',' )
			.map(
				( id ) =>
					`${ ROW }[data-block="${ id }"] .block-editor-list-view-block-select-button__title::after`
			);
		const hiddenText = `, ${ __( 'label only, doesn’t link anywhere' ) }`;
		rules.push(
			`${ titles.join( ',' ) } {
				content: "" / ${ JSON.stringify( hiddenText ) };
			}`
		);
	}

	if ( ! rules.length ) {
		return null;
	}

	return <style>{ rules.join( '\n' ) }</style>;
}
