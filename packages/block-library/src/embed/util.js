/**
 * Internal dependencies
 */
import { common, others } from './core-embeds';
import { DEFAULT_EMBED_BLOCK } from './constants';

/**
 * External dependencies
 */
import { includes } from 'lodash';

export const matchesPatterns = ( url, patterns = [] ) => {
	return patterns.some( ( pattern ) => {
		return url.match( pattern );
	} );
};

export const findBlock = ( url ) => {
	for ( const block of [ ...common, ...others ] ) {
		if ( matchesPatterns( url, block.patterns ) ) {
			return block.name;
		}
	}
	return DEFAULT_EMBED_BLOCK;
};

export const isFromWordPress = ( html ) => {
	return includes( html, 'class="wp-embedded-content" data-secret' );
};
