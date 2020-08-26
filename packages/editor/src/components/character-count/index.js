/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { count as characterCount } from '@wordpress/wordcount';

function CharacterCount( { content } ) {
	return characterCount( content, 'characters_including_spaces' );
}

export default withSelect( ( select ) => {
	return {
		content: select( 'core/editor' ).getEditedPostAttribute( 'content' ),
	};
} )( CharacterCount );
