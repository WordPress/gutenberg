/**
 * WordPress dependencies
 */
import { createElement } from 'element';

/**
 * External dependencies
 */
import { nodeListToReact } from 'dom-react';
import { flow } from 'lodash';
import {
	attr as originalAttr,
	prop as originalProp,
	html as originalHtml,
	text as originalText,
	query as originalQuery,
} from 'hpq';

/**
 * Given a matcher function creator, returns a new function which applies an
 * internal flag to the created matcher.
 *
 * @param  {Function} fn Original matcher function creator
 * @return {Function}    Modified matcher function creator
 */
function withKnownMatcherFlag( fn ) {
	return flow( fn, ( matcher ) => {
		matcher._wpBlocksKnownMatcher = true;
		return matcher;
	} );
}

export const attr = withKnownMatcherFlag( originalAttr );
export const prop = withKnownMatcherFlag( originalProp );
export const html = withKnownMatcherFlag( originalHtml );
export const text = withKnownMatcherFlag( originalText );
export const query = withKnownMatcherFlag( originalQuery );
export const children = withKnownMatcherFlag( ( selector ) => {
	return ( node ) => {
		let match = node;

		if ( selector ) {
			match = node.querySelector( selector );
		}

		if ( match ) {
			return nodeListToReact( match.childNodes || [], createElement );
		}

		return [];
	};
} );
