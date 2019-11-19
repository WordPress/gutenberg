/**
 * External dependencies
 */
import { escapeRegExp } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Fragment,
} from '@wordpress/element';

const TextHighlight = ( { text = '', highlight = '' } ) => {
	if ( ! highlight.trim() ) {
		return text;
	}

	const regex = new RegExp( `(${ escapeRegExp( highlight ) })`, 'gi' );
	const parts = text.split( regex );
	return (
		<Fragment>
			{ parts.filter( ( part ) => part ).map( ( part, i ) => (
				regex.test( part ) ? <mark key={ i }>{ part }</mark> : <span key={ i }>{ part }</span>
			) ) }
		</Fragment>
	);
};

export default TextHighlight;
