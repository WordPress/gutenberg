/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Placeholder, TextControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { blockDefault } from '@wordpress/icons';
import {
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';

const ALLOWED_BLOCKS = [
	'core/post-comment-content',
	'core/post-comment-author',
	'core/post-comment-date',
	'core/post-comment-reply-link',
];
const TEMPLATE = [
	[ 'core/post-comment-content' ],
	[ 'core/post-comment-author' ],
	[ 'core/post-comment-reply-link' ],
];

export default function Edit( { attributes: { commentId }, setAttributes } ) {
	const [ commentIdInput, setCommentIdInput ] = useState( commentId );
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		allowedBlocks: ALLOWED_BLOCKS,
	} );

	if ( ! commentId ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ blockDefault }
					label={ _x( 'Post Comment', 'block title' ) }
					instructions={ __(
						'To show a comment, input the comment ID.'
					) }
				>
					<TextControl
						value={ commentId }
						onChange={ ( val ) =>
							setCommentIdInput( parseInt( val ) )
						}
					/>

					<Button
						variant="primary"
						onClick={ () => {
							setAttributes( { commentId: commentIdInput } );
						} }
					>
						{ __( 'Save' ) }
					</Button>
				</Placeholder>
			</div>
		);
	}

	return <div { ...innerBlocksProps } />;
}
