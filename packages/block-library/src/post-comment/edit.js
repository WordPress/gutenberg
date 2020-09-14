/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder, TextControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { blockDefault } from '@wordpress/icons';
import { InnerBlocks } from '@wordpress/block-editor';

const ALLOWED_BLOCKS = [ [ 'core/post-comment-content' ] ];

// TODO: JSDOC types
export default function Edit( { className, attributes, setAttributes } ) {
	const { commentId } = attributes;
	const [ commentIdInput, setCommentIdInput ] = useState( commentId );

	if ( ! commentId ) {
		return (
			<Placeholder
				icon={ blockDefault }
				label={ __( 'Post Comment' ) }
				instructions={ __( 'Input post comment ID' ) }
			>
				<TextControl
					value={ commentId }
					onChange={ ( val ) => setCommentIdInput( parseInt( val ) ) }
				/>

				<Button
					isPrimary
					onClick={ () => {
						setAttributes( { commentId: commentIdInput } );
					} }
				>
					{ __( 'Save' ) }
				</Button>
			</Placeholder>
		);
	}

	return (
		<div className={ className }>
			<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } />
		</div>
	);
}
