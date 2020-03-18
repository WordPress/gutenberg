/**
 * External dependencies
 */
import { escapeRegExp } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalCreateInterpolateElement } from '@wordpress/element';

const TextHighlight = ( { text = '', highlight = '' } ) => {
	const trimmedHighlightText = highlight.trim();

	if ( ! trimmedHighlightText ) {
		return text;
	}

	const regex = new RegExp(
		`(${ escapeRegExp( trimmedHighlightText ) })`,
		'gi'
	);

	return __experimentalCreateInterpolateElement(
		text.replace( regex, '<mark>$&</mark>' ),
		{
			mark: <mark />,
		}
	);
};

export default TextHighlight;
