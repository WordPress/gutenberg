/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { __experimentalTruncate as Truncate } from '@wordpress/components';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Internal dependencies
 */
import StatusLabel from './status-label';

// Taken from packages/editor/src/components/time-to-read/index.js.
const AVERAGE_READING_RATE = 189;

export default function getPageDetails( page ) {
	if ( ! page ) {
		return [];
	}

	const details = [
		{
			label: __( 'Status' ),
			value: (
				<StatusLabel
					status={ page?.password ? 'protected' : page.status }
					date={ page?.date }
				/>
			),
		},
		{
			label: __( 'Slug' ),
			value: <Truncate numberOfLines={ 1 }>{ page.slug }</Truncate>,
		},
	];

	if ( page?.templateTitle ) {
		details.push( {
			label: __( 'Template' ),
			value: page.templateTitle,
		} );
	}

	details.push( {
		label: __( 'Parent' ),
		value: page?.parentTitle,
	} );

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );
	const wordsCounted = page?.content?.rendered
		? wordCount( page.content.rendered, wordCountType )
		: 0;
	const readingTime = Math.round( wordsCounted / AVERAGE_READING_RATE );

	if ( wordsCounted ) {
		details.push(
			{
				label: __( 'Words' ),
				value: wordsCounted.toLocaleString() || __( 'Unknown' ),
			},
			{
				label: __( 'Time to read' ),
				value:
					readingTime > 1
						? sprintf(
								/* translators: %s: is the number of minutes. */
								__( '%s mins' ),
								readingTime.toLocaleString()
						  )
						: __( '< 1 min' ),
			}
		);
	}
	return details;
}
