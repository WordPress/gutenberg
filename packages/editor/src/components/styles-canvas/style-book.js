/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import StyleBook from '../style-book';
import { STYLE_BOOK_COLOR_GROUPS } from '../style-book/constants';

/**
 * Style Book content component for global styles.
 * Provides the business logic for StyleBook behavior in the global styles context.
 *
 * @param {Object}             props              Component props.
 * @param {string}             props.path         Current path in global styles.
 * @param {Function}           props.onPathChange Callback when the path changes.
 * @param {React.ForwardedRef} ref                Ref to the Style Book component.
 * @return {React.JSX.Element} The Style Book component.
 */
function StylesCanvasStyleBook( { path, onPathChange }, ref ) {
	return (
		<StyleBook
			ref={ ref }
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
export default forwardRef( StylesCanvasStyleBook );
