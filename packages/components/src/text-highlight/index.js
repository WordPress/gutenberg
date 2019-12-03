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

	return __experimentalCreateInterpolateElement(
		text.replace( regex, '<mark>$&</mark>' ),
		{
			mark: <mark />,
		}
	);
};

export default TextHighlight;
