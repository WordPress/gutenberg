/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { _x, _n, __, sprintf } from '@wordpress/i18n';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Average reading rate - based on average taken from
 * https://irisreading.com/average-reading-speed-in-various-languages/
 * (Characters/minute used for Chinese rather than words).
 */
const AVERAGE_READING_RATE = 189;

function PostTimeToReadEdit( { attributes, setAttributes } ) {
	const { textAlign, minutesToRead } = attributes;

	const content = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'content' ),
		[]
	);

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );

	useEffect( () => {
		const newMinutesToRead = Math.round(
			wordCount( content, wordCountType ) / AVERAGE_READING_RATE
		);
		// This is required to keep undo working and not create 2 undo steps
		// for the content change.
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( {
			minutesToRead: content ? newMinutesToRead : undefined,
		} );
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
				: __( 'You can read this post less than a minute.' );
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
