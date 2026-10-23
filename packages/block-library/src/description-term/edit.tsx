import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import type { BlockEditProps, Block } from '@wordpress/blocks';
import type { RichTextData } from '@wordpress/rich-text';
import useGuidedEnterAtEnd from '../description-list/use-guided-enter-at-end';
import useStructurePreservingMerge from '../description-list/use-structure-preserving-merge';
import DescriptionListStructureWarning from '../description-list/structure-warning';

type DescriptionListItemAttributes = {
	content: string | RichTextData;
	placeholder?: string;
};

type DescriptionListItemEditProps =
	BlockEditProps< DescriptionListItemAttributes > & {
		mergeBlocks?: ( forward: boolean ) => void;
		onReplace?: (
			blocks: Block | Block[],
			indexToSelect?: number,
			initialPosition?: number | null
		) => void;
		onRemove?: () => void;
	};

export default function Edit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	onRemove,
	clientId,
	isSelected,
}: DescriptionListItemEditProps ) {
	const { content, placeholder } = attributes;
	const blockProps = useBlockProps();
	const onSplitAtEnd = useGuidedEnterAtEnd( {
		blockName: 'core/description-term',
		clientId,
	} );
	const onMerge = useStructurePreservingMerge( { clientId, mergeBlocks } );

	return (
		<>
			<DescriptionListStructureWarning
				clientId={ clientId }
				isSelected={ isSelected }
			/>
			<RichText
				identifier="content"
				tagName="dt"
				{ ...blockProps }
				value={ content }
				onChange={ ( newContent: string | RichTextData ) =>
					setAttributes( { content: newContent } )
				}
				onMerge={ mergeBlocks ? onMerge : undefined }
				onReplace={ onReplace }
				onRemove={ onRemove }
				placeholder={ placeholder || __( 'Term' ) }
				__unstableOnSplitAtEnd={ onSplitAtEnd }
			/>
		</>
	);
}
