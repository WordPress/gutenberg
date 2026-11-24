// Blocks that take inner blocks but get no appender for them in a Navigation
// List View. A link takes inner blocks only so that it can become a submenu,
// which its "Add submenu link" option does. A Page List and its items show the
// site's pages, and save nothing added to them.
const BLOCKS_WITHOUT_APPENDER = [
	'core/navigation-link',
	'core/page-list',
	'core/page-list-item',
];

/**
 * Whether a Navigation List View offers an appender for the inner blocks of a
 * block. An empty submenu gets one, though its canvas shows none until it is
 * selected.
 *
 * @param blockName The block's name.
 */
export function hasNavigationInnerBlockAppender( blockName: string ): boolean {
	return ! BLOCKS_WITHOUT_APPENDER.includes( blockName );
}
