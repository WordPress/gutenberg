/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentToolbar,
	BlockControls,
	Warning,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export default function PostCommentsFormEdit( {
	attributes,
	context,
	setAttributes,
} ) {
	const { textAlign } = attributes;
	const { postId, postType } = context;
	const [ commentStatus ] = useEntityProp(
		'postType',
		postType,
		'comment_status',
		postId
	);

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
			<Block.div
				className={ classnames( {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
			>
				{ ! commentStatus && (
					<Warning>
						{ __(
							'Post Comments Form block: comments are not enabled for this post type.'
						) }
					</Warning>
				) }

				{ 'open' !== commentStatus && (
					<Warning>
						{ __(
							'Post Comments Form block: comments to this post are not allowed.'
						) }
					</Warning>
				) }

				{ 'open' === commentStatus && __( 'Post Comments Form' ) }
			</Block.div>
		</>
	);
}
