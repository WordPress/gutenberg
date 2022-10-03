/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { _x, _n, __, sprintf } from '@wordpress/i18n';
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Average reading rate - based on average taken from
 * https://irisreading.com/average-reading-speed-in-various-languages/
 * (Characters/minute used for Chinese rather than words).
 */
const AVERAGE_READING_RATE = 189;

function PostTimeToReadEdit( { attributes, setAttributes, context } ) {
	const { textAlign } = attributes;
	const { postId, postType } = context;
	const [ minutesToRead, setMinituesToRead ] = useState();

	const [ content = '' ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );

	useEffect( () => {
		setMinituesToRead(
			Math.round(
				wordCount( content, wordCountType ) / AVERAGE_READING_RATE
			)
		);
	}, [ content ] );

	let minutesToReadString = __( 'There is no content.' );

	if ( minutesToRead !== undefined ) {
		minutesToReadString =
			minutesToRead !== 0
				? sprintf(
						/* translators: %d is the number of minutes the post will take to read. */
						_n(
							'You can read this post in %d minute.',
							'You can read this post in %d minutes.',
							minutesToRead
						),
						minutesToRead
				  )
				: __( 'You can read this post in less than a minute.' );
	}

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<p { ...blockProps }>{ minutesToReadString }</p>
		</>
	);
}

export default PostTimeToReadEdit;
