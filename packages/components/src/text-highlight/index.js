/**
 * External dependencies
 */
import { escapeRegExp } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalCreateInterpolateElement,
} from '@wordpress/element';

const TextHighlight = ( { text = '', highlight = '' } ) => {
	if ( ! highlight.trim() ) {
		return text;
	}

	const regex = new RegExp( `(${ escapeRegExp( highlight ) })`, 'gi' );
	const parts = text.split( regex ).filter( ( part ) => part );

	const interpolatedString = parts.map( ( part ) => {
		return regex.test( part ) ? `<mark>${ part }</mark>` : `<span>${ part }</span>`;
	} ).join( '' );

	return __experimentalCreateInterpolateElement(
		interpolatedString,
		{
			mark: <mark />,
			span: <span />,
		}
	);
};

export default TextHighlight;
