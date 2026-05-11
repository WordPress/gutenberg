/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { _x, _n, __, sprintf } from '@wordpress/i18n';
import { count as wordCount } from '@wordpress/wordcount';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Average reading rate - based on average taken from
 * https://irisreading.com/average-reading-speed-in-various-languages/
 * (Characters/minute used for Chinese rather than words).
 *
 * @type {number} A rough estimate of the average reading rate across multiple languages.
 */
const AVERAGE_READING_RATE = 189;

/**
 * Component for showing Time To Read in Content.
 *
 * @return {React.ReactNode} The rendered TimeToRead component.
 */
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
	const minutesToReadString =
		minutesToRead === 0
			? createInterpolateElement( __( '<span>< 1</span> minute' ), {
					span: <span />,
			  } )
			: createInterpolateElement(
					sprintf(
						/* translators: %s: the number of minutes to read the post. */
						_n(
							'<span>%s</span> minute',
							'<span>%s</span> minutes',
							minutesToRead
						),
						minutesToRead
					),
					{
						span: <span />,
					}
			  );

	return <span className="time-to-read">{ minutesToReadString }</span>;
}
