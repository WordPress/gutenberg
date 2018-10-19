/**
 * Internal dependencies
 */
import { common, others } from './core-embeds';

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
	return 'core/embed';
};
