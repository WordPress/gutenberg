/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { traverse, urlRewrite } from '@wordpress/editor';

let editorStylesCache = [];

/**
 * Parse editor styles.
 *
 * @param {Object} select
 * @return {Array} css rule set array.
 */
const getEditorStyles = ( select ) => {
	if ( editorStylesCache.length === 0 ) {
		const { getEditorSettings } = select( 'core/editor' );
		const styles = getEditorSettings().styles;
		if ( styles && styles.length > 0 ) {
			editorStylesCache = map( styles, ( { css, baseURL } ) => {
				if ( ! baseURL ) {
					return css;
				}
				return traverse( css, urlRewrite( baseURL ) );
			} );
		}
	}
	return editorStylesCache;
};

export default getEditorStyles;
