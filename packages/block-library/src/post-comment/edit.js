/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder, TextControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { blockDefault } from '@wordpress/icons';
import { useEntityProp } from '@wordpress/core-data';

// TODO: JSDOC types
export default function Edit( { className, attributes, setAttributes } ) {
	const { commentId } = attributes;
	const [ commentIdInput, setCommentIdInput ] = useState( commentId );

	const [ content ] = useEntityProp(
		'root',
		'comment',
		'content',
		commentId
	);

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
		<p className={ className }>
			Comment ID: { commentId } { content }
		</p>
	);
}
