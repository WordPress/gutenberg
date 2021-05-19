/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps, store } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

export default function CaptionEdit( {
	attributes,
	setAttributes,
	onRemove,
	clientId,
} ) {
	const { content } = attributes;
	const blockProps = useBlockProps();
	const { getBlockRootClientId, getBlockIndex } = useSelect( store );
	const { insertBlocks } = useDispatch( store );

	return (
		<RichText
			{ ...blockProps }
			identifier="content"
			tagName="figcaption"
			value={ content }
			onChange={ ( newContent ) =>
				setAttributes( { content: newContent } )
			}
			placeholder={ __( 'Caption text' ) }
			onRemove={ onRemove }
			__unstableOnSplitAtEnd={ () => {
				const parentClientId = getBlockRootClientId( clientId );
				const rootClientId = getBlockRootClientId( parentClientId );
				const index = getBlockIndex( parentClientId, rootClientId );
				insertBlocks(
					createBlock( 'core/paragraph' ),
					index + 1,
					rootClientId
				);
			} }
		/>
	);
}
