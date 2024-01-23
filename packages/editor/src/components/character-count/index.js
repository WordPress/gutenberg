/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { count as characterCount } from '@wordpress/wordcount';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function CharacterCount() {
	const content = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'content' ),
		[]
	);

	return characterCount( content, 'characters_including_spaces' );
}
