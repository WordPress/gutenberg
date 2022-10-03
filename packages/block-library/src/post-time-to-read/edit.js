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
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';
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

	const [ contentStructure ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);

	const [ blocks ] = useEntityBlockEditor( 'postType', postType, {
		id: postId,
	} );

	// Replicates the logic found in getEditedPostContent().
	let content;
	if ( contentStructure instanceof Function ) {
		content = contentStructure( { blocks } );
	} else if ( blocks ) {
		// If we have parsed blocks already, they should be our source of truth.
		// Parsing applies block deprecations and legacy block conversions that
		// unparsed content will not have.
		content = __unstableSerializeAndClean( blocks );
	} else {
		content = contentStructure;
	}

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );

	const minutesToRead = Math.round(
		wordCount( content, wordCountType ) / AVERAGE_READING_RATE
	);

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
