/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	AlignmentToolbar,
	BlockControls,
	Warning,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';

function PostCommentsDisplay( { postId } ) {
	return useSelect(
		( select ) => {
			const comments = select( 'core' ).getEntityRecords(
				'root',
				'comment',
				{
					post: postId,
				}
			);
			// TODO: "No Comments" placeholder should be editable.
			return comments && comments.length
				? comments.map( ( comment ) => (
						<p key={ comment.id }>
							<RawHTML>{ comment.content.raw }</RawHTML>
						</p>
				  ) )
				: __( 'No comments.' );
		},
		[ postId ]
	);
}

export default function PostCommentsEdit( {
	attributes,
	setAttributes,
	context,
} ) {
	const { postType, postId } = context;
	const { textAlign } = attributes;

	if ( ! postType || ! postId ) {
		return (
			<Warning>{ __( 'Post comments block: no post found.' ) }</Warning>
		);
	} else if ( postType !== 'post' ) {
		return (
			<Warning>
				{ __(
					'Post comments block: Comments are only available in posts. Please add this block to a post instead.'
				) }
			</Warning>
		);
	}

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>

			<div
				className={ classnames( 'wp-block-post-comments', {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
			>
				<PostCommentsDisplay postId={ postId } />
			</div>
		</>
	);
}
