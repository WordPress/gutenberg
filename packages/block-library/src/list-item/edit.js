/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function ListItemEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: [ 'core/list' ],
		}
	);

	return (
		<li { ...blockProps }>
			<RichText
				identifier="content"
				tagName="div"
				onChange={ ( nextContent ) =>
					setAttributes( { content: nextContent } )
				}
				value={ attributes.content }
				aria-label={ __( 'List text' ) }
				placeholder={ attributes.placeholder || __( 'List' ) }
			/>
			<div { ...innerBlocksProps } />
		</li>
	);
}
