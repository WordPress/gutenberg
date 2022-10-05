/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { _x, _n, __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
	RichText,
} from '@wordpress/block-editor';
import {
	createBlock,
	getDefaultBlockName,
	__unstableSerializeAndClean,
} from '@wordpress/blocks';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Average reading rate - based on average taken from
 * https://irisreading.com/average-reading-speed-in-various-languages/
 * (Characters/minute used for Chinese rather than words).
 */
const AVERAGE_READING_RATE = 189;

// Allowed formats for the prefix and suffix fields.
const ALLOWED_FORMATS = [
	'core/bold',
	'core/image',
	'core/italic',
	'core/link',
	'core/strikethrough',
	'core/text-color',
];

function PostTimeToReadEdit( {
	attributes,
	setAttributes,
	insertBlocksAfter,
	isSelected,
	context,
} ) {
	const { textAlign, prefix, suffix } = attributes;
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
			'Word count type. Do not translate!'
		);

		const minutesToRead = Math.round(
			wordCount( content, wordCountType ) / AVERAGE_READING_RATE
		);

		if ( minutesToRead === undefined ) {
			return __( 'There is no content.' );
		}

		return minutesToRead !== 0
			? sprintf(
					/* translators: %d is the number of minutes the post will take to read. */
					_n( '%d minute', '%d minutes', minutesToRead ),
					minutesToRead
			  )
			: __( 'less than a minute' );
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
			<p { ...blockProps }>
				{ ( isSelected || prefix ) && (
					<RichText
						allowedFormats={ ALLOWED_FORMATS }
						className="wp-block-post-time-to-read__prefix"
						multiline={ false }
						aria-label={ __( 'Prefix' ) }
						placeholder={ __( 'Prefix' ) + ' ' }
						value={ prefix }
						onChange={ ( value ) =>
							setAttributes( { prefix: value } )
						}
						tagName="span"
					/>
				) }
				{ minutesToReadString }
				{ ( isSelected || suffix ) && (
					<RichText
						allowedFormats={ ALLOWED_FORMATS }
						className="wp-block-post-time-to-read__suffix"
						multiline={ false }
						aria-label={ __( 'Suffix' ) }
						placeholder={ ' ' + __( 'Suffix' ) }
						value={ suffix }
						onChange={ ( value ) =>
							setAttributes( { suffix: value } )
						}
						tagName="span"
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter(
								createBlock( getDefaultBlockName() )
							)
						}
					/>
				) }
			</p>
		</>
	);
}

export default PostTimeToReadEdit;
