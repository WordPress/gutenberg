/**
 * External dependencies
 */
import classnames from 'clsx';

/**
 * WordPress dependencies
 */
import { _x, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
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

	const minutesToReadString = useMemo( () => {
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
		const wordCountType = _x(
			'words',
			'Word count type. Do not translate!',
			'time-to-read-block'
		);

		const minutesToRead = Math.max(
			1,
			Math.round(
				wordCount( content, wordCountType ) / AVERAGE_READING_RATE
			)
		);

		return sprintf(
			/* translators: %d is the number of minutes the post will take to read. */
			_n(
				'%d minute',
				'%d minutes',
				minutesToRead,
				'time-to-read-block'
			),
			minutesToRead
		);
	}, [ contentStructure, blocks ] );

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
			<div { ...blockProps }>{ minutesToReadString }</div>
		</>
	);
}

export default PostTimeToReadEdit;
