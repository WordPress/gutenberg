/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * External dependencies
 */
import { nodeListToReact, nodeToReact } from 'dom-react';
import { flow } from 'lodash';
import {
	attr as originalAttr,
	prop as originalProp,
	html as originalHtml,
	text as originalText,
	query as originalQuery,
} from 'hpq';

/**
 * Given a source function creator, returns a new function which applies an
 * internal flag to the created source.
 *
 * @param  {Function} fn Original source function creator
 * @return {Function}    Modified source function creator
 */
function withKnownSourceFlag( fn ) {
	return flow( fn, ( source ) => {
		source._wpBlocksKnownSource = true;
		return source;
	} );
}

export const attr = withKnownSourceFlag( originalAttr );
export const prop = withKnownSourceFlag( originalProp );
export const html = withKnownSourceFlag( originalHtml );
export const text = withKnownSourceFlag( originalText );
export const query = withKnownSourceFlag( originalQuery );
export const children = withKnownSourceFlag( ( selector ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		if ( match ) {
			return nodeListToReact( match.childNodes || [], createElement );
		}

		return [];
	};
} );
export const node = withKnownSourceFlag( ( selector ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		return nodeToReact( match, createElement );
	};
} );
