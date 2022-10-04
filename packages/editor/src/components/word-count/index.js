/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function WordCount() {
	const content = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'content' ),
		[]
	);

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );

	return (
		<span className="word-count">
			{ wordCount( content, wordCountType ) }
		</span>
	);
}
