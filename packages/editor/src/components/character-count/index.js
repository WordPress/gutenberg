/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { count as characterCount } from '@wordpress/wordcount';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Renders the character count of the post content.
 *
 * @return {number} The character count.
 */
export default function CharacterCount() {
	const content = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'content' ),
		[]
	);

	return characterCount( content, 'characters_including_spaces' );
}
