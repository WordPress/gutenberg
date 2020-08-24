/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder, TextControl } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';
import { useEntityProp } from '@wordpress/core-data';

// TODO: JSDOC types
export default function Edit( { className, attributes, setAttributes } ) {
	const { commentId } = attributes;

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
					onChange={ ( val ) =>
						setAttributes( { commentId: parseInt( val ) } )
					}
				/>
			</Placeholder>
		);
	}

	return (
		<p className={ className }>
			Comment ID: { commentId } { content }
		</p>
	);
}
