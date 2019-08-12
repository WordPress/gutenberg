/**
 * External dependencies
 */
import {
	filter,
	get,
	map,
	some,
} from 'lodash';
import ElementQueries from 'css-element-queries/src/ElementQueries';

/**
 * Internal dependencies
 */
import traverse from '../transform-styles/traverse';
import wrap from '../transform-styles/transforms/wrap';

function parseMediaQueryRule( rule ) {
	// Make sure there are no multiple media rules.
	if ( ! rule.media || rule.media.length !== 1 ) {
		return null;
	}

	const mediaQueryCondition = rule.media[ 0 ];
	// Verify if it is a simple media query that could be transformed into an element query.
	const mediaMatches = mediaQueryCondition.match( /^\(((min|max)-(width|height)):([^\(]*?)\)$/ );
	if ( ! mediaMatches || ! mediaMatches[ 1 ] || ! mediaMatches[ 4 ] ) {
		return null;
	}
	return {
		property: mediaMatches[ 1 ].trim(),
		value: mediaMatches[ 4 ].trim(),
	};
}

function getStyleSheetsThatMatchPaths( partialPaths ) {
	return filter(
		get( window, [ 'document', 'styleSheets' ], [] ),
		( styleSheet ) => {
			return (
				styleSheet.href &&
				some(
					partialPaths,
					( partialPath ) => {
						return styleSheet.href.includes( partialPath );
					}
				)
			);
		}
	);
}

function getMediaQueryInnerText( rule ) {
	return map(
		rule.cssRules,
		( { cssText } ) => ( cssText )
	).join( '\n' );
}

function getTransformedMediaQuery( elementQuerySelectors, rule ) {
	const parsedMediaQuery = parseMediaQueryRule( rule );
	if ( ! parsedMediaQuery ) {
		return;
	}
	const mediaQueryText = getMediaQueryInnerText( rule );
	return map(
		elementQuerySelectors,
		( selector ) => traverse(
			mediaQueryText,
			wrap( `${ selector }[${ parsedMediaQuery.property }~="${ parsedMediaQuery.value }"]` )
		)
	).join( '\n' );
}

/**
 * Applies a series of CSS rule transforms to convert simple media queries into element queries handled by css-element-queries package.
 * Initializes css-element-queries mechanism.
 *
 * @param {Array} elementQuerySelectors CSS selector whose element query dimensions will depend on.
 * @param {Array}  partialPaths         CSS rules.
 */
export default function transformMediaQueries( elementQuerySelectors, partialPaths ) {
	if ( ! window || ! window.document ) {
		return;
	}

	const styleSheets = getStyleSheetsThatMatchPaths( partialPaths );

	const rulesToProcess = [];

	styleSheets.forEach(
		( styleSheet ) => {
			for ( let i = 0; i < styleSheet.rules.length; ) {
				const rule = styleSheet.rules[ i ];
				const transformedMediaQuery = getTransformedMediaQuery( elementQuerySelectors, rule );
				if ( transformedMediaQuery ) {
					rulesToProcess.push( transformedMediaQuery );
					// Remove the rule.
					styleSheet.removeRule( i );
				} else {
					++i;
				}
			}
		}
	);
	if ( ! rulesToProcess.length ) {
		return;
	}

	const elementQueriesCode = rulesToProcess.join( '\n' );
	const node = document.createElement( 'style' );
	node.innerHTML = elementQueriesCode;
	document.body.appendChild( node );
	ElementQueries.listen();
	ElementQueries.init();
}
