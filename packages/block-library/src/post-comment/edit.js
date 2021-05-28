/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder, TextControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { blockDefault } from '@wordpress/icons';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const ALLOWED_BLOCKS = [
	'core/post-comment-content',
	'core/post-comment-author',
];

// TODO: JSDOC types
export default function Edit( { attributes, setAttributes } ) {
	const { commentId } = attributes;
	const [ commentIdInput, setCommentIdInput ] = useState( commentId );
	const blockProps = useBlockProps();

	if ( ! commentId ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ blockDefault }
					label={ __( 'Post Comment' ) }
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

	return (
		<div { ...blockProps }>
			<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } />
		</div>
	);
}
