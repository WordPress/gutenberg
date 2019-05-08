/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { count as charCount } from '@wordpress/wordcount';

function CharCount( { content } ) {
	/*
	 * Two options available for counting: 'characters_excluding_spaces' or 'characters_including_spaces'
	 * Do not translate into your own language.
	 */
	const charCountType = _x( 'characters_including_spaces', 'Character count type. Do not translate literally!' );

	return (
		<span className="char-count">{ charCount( content, charCountType ) }</span>
	);
}

export default withSelect( ( select ) => {
	return {
		content: select( 'core/editor' ).getEditedPostAttribute( 'content' ),
	};
} )( CharCount );
