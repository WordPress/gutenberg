/**
 * WordPress dependencies
 */
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	InnerBlocks,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-widget-box__inner-blocks',
		},
		{
			renderAppender: InnerBlocks.ButtonBlockAppender,
		}
	);

	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<RichText
				className="widget-title"
				tagName="h2"
				aria-label={ __( 'Widget title' ) }
				placeholder={ __( 'Add a Widget title' ) }
				value={ attributes.widgetTitle }
				onChange={ ( value ) =>
					setAttributes( { widgetTitle: value } )
				}
				onSplit={ ( value, isOriginal ) => {
					let block;

					if ( isOriginal || value ) {
						block = createBlock( 'core/heading', {
							...attributes,
							content: value,
						} );
					} else {
						block = createBlock( 'core/paragraph' );
					}

					if ( isOriginal ) {
						block.clientId = clientId;
					}

					return block;
				} }
			/>
			<div { ...innerBlocksProps } />
		</div>
	);
}
