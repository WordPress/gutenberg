/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

export default function ListItemEdit( {
	name,
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
} ) {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/list' ],
	} );

	return (
		<li { ...innerBlocksProps }>
			<RichText
				identifier="content"
				tagName="div"
				onChange={ ( nextContent ) =>
					setAttributes( { content: nextContent } )
				}
				value={ attributes.content }
				aria-label={ __( 'List text' ) }
				placeholder={ attributes.placeholder || __( 'List' ) }
				onSplit={ ( value ) =>
					createBlock( name, {
						...attributes,
						content: value,
					} )
				}
				onMerge={ mergeBlocks }
				onReplace={ onReplace }
			/>
			{ innerBlocksProps.children }
		</li>
	);
}
