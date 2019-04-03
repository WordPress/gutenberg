/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { count as charCount } from '@wordpress/wordcount';

function CharCount( { content } ) {
	/*
	 * Only count the number of characters (no spaces).
	 * Do not translate into your own language.
	 */
	const charCountType = _x( 'characters_excluding_spaces', 'Word count type. Do not translate!' );

	return (
		<span className="char-count">{ charCount( content, charCountType ) }</span>
	);
}

export default withSelect( ( select ) => {
	return {
		content: select( 'core/editor' ).getEditedPostAttribute( 'content' ),
	};
} )( CharCount );
