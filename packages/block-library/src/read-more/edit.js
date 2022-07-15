/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function ReadMore( {
	attributes: { content, linkTarget },
	clientId,
	setAttributes,
	insertBlocksAfter,
} ) {
	const blockProps = useBlockProps();
	const { insertBeforeBlock } = useDispatch( blockEditorStore );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open in new tab' ) }
						onChange={ ( value ) =>
							setAttributes( {
								linkTarget: value ? '_blank' : '_self',
							} )
						}
						checked={ linkTarget === '_blank' }
					/>
				</PanelBody>
			</InspectorControls>
			<RichText
				tagName="a"
				aria-label={ __( '"Read more" link text' ) }
				placeholder={ __( 'Read more' ) }
				value={ content }
				onChange={ ( newValue ) =>
					setAttributes( { content: newValue } )
				}
				__unstableOnSplitAtStart={ () => {
					insertBeforeBlock( clientId );
				} }
				__unstableOnSplitAtEnd={ () =>
					insertBlocksAfter( createBlock( getDefaultBlockName() ) )
				}
				withoutInteractiveFormatting={ true }
				{ ...blockProps }
			/>
		</>
	);
}
