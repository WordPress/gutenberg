/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import StyleBook from '../style-book';
import { STYLE_BOOK_COLOR_GROUPS } from '../style-book/constants';

/**
 * Style Book integration - renders conditionally when style book is active.
 *
 * @param {Object}   props              Component props.
 * @param {string}   props.path         Current path in the style book.
 * @param {Function} props.onPathChange Callback when the path changes.
 * @return {JSX.Element|null} The Style Book component or null.
 */
export function GlobalStylesStyleBook( { path, onPathChange } ) {
	const editorCanvasContainerView = useSelect(
		( select ) =>
			unlock( select( editSiteStore ) ).getEditorCanvasContainerView(),
		[]
	);

	if (
		editorCanvasContainerView !== 'style-book' &&
		editorCanvasContainerView !== 'global-styles-revisions:style-book'
	) {
		return null;
	}

	return (
		<StyleBook
			isSelected={ ( blockName ) =>
				// Match '/blocks/core%2Fbutton' and
				// '/blocks/core%2Fbutton/typography', but not
				// '/blocks/core%2Fbuttons'.
				path === `/blocks/${ encodeURIComponent( blockName ) }` ||
				path?.startsWith(
					`/blocks/${ encodeURIComponent( blockName ) }/`
				)
			}
			onSelect={ ( blockName ) => {
				if (
					STYLE_BOOK_COLOR_GROUPS.find(
						( group ) => group.slug === blockName
					)
				) {
					// Go to color palettes Global Styles.
					onPathChange?.( '/colors/palette' );
					return;
				}
				if ( blockName === 'typography' ) {
					// Go to typography Global Styles.
					onPathChange?.( '/typography' );
					return;
				}

				// Now go to the selected block.
				onPathChange?.( '/blocks/' + encodeURIComponent( blockName ) );
			} }
		/>
	);
}
