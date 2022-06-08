/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { _x, _n } from '@wordpress/i18n';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const AVERAGE_READING_RATE = 200;

export default function TimeToRead() {
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
	const minutesToRead = Math.round(
		wordCount( content, wordCountType ) / AVERAGE_READING_RATE
	);

	return (
		<span className="time-to-read">
			<span className="table-of-contents__number">
				{ minutesToRead }{ ' ' }
			</span>
			{ _n( 'minute', 'minutes', minutesToRead ) }
		</span>
	);
}
