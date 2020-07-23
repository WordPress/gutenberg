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

	if ( ! commentStatus ) {
		return (
			<Warning>
				{ __(
					'Post Comments Form block: Comments are not enabled for this post type.'
				) }
			</Warning>
		);
	}
	if ( 'open' !== commentStatus ) {
		return (
			<Warning>
				{ __(
					'Post Comments Form block: Comments to this post are not allowed.'
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
			<Block.div
				className={ classnames( {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
			>
				{ __( 'Post Comments Form' ) }
			</Block.div>
		</>
	);
}
