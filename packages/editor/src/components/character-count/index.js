/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { count as characterCount } from '@wordpress/wordcount';

export default function CharacterCount() {
	const content = useSelect( ( select ) =>
		select( 'core/editor' ).getEditedPostAttribute( 'content' )
	);

	return characterCount( content, 'characters_including_spaces' );
}
