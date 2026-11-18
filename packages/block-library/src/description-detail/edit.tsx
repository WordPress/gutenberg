import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import type { RichTextData } from '@wordpress/rich-text';
import useGuidedEnterAtEnd from '../description-list/use-guided-enter-at-end';
import useStructurePreservingMerge from '../description-list/use-structure-preserving-merge';
import DescriptionListStructureWarning from '../description-list/structure-warning';

type DescriptionListItemAttributes = {
	content: string | RichTextData;
	placeholder?: string;
};

export default function Edit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	onRemove,
	clientId,
	isSelected,
}: BlockEditProps< DescriptionListItemAttributes > ) {
	const { content, placeholder } = attributes;
	const blockProps = useBlockProps();
	const onSplitAtEnd = useGuidedEnterAtEnd();
	const onMerge = useStructurePreservingMerge( mergeBlocks );

	return (
		<>
			{ isSelected && (
				<DescriptionListStructureWarning clientId={ clientId } />
			) }
			<RichText
				identifier="content"
				tagName="dd"
				{ ...blockProps }
				value={ content }
				onChange={ ( newContent: string | RichTextData ) =>
					setAttributes( { content: newContent } )
				}
				onMerge={ mergeBlocks ? onMerge : undefined }
				onReplace={ onReplace }
				onRemove={ onRemove }
				placeholder={ placeholder || __( 'Description' ) }
				__unstableOnSplitAtEnd={ onSplitAtEnd }
			/>
		</>
	);
}
