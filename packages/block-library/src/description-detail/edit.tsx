import { __ } from '@wordpress/i18n';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { RichText, useBlockProps } from '@wordpress/block-editor';
import type { BlockEditProps, Block } from '@wordpress/blocks';
import type { RichTextData } from '@wordpress/rich-text';
import useGuidedEnterAtEnd from '../description-list/use-guided-enter-at-end';

type DescriptionListItemAttributes = {
	content: string | RichTextData;
	placeholder?: string;
};

type DescriptionListItemEditProps =
	BlockEditProps< DescriptionListItemAttributes > & {
		mergeBlocks?: ( clientIdA: string, clientIdB: string ) => void;
		onReplace?: (
			blocks: Block[],
			indexToSelect?: number,
			initialPosition?: number
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
}: DescriptionListItemEditProps ) {
	const { content, placeholder } = attributes;
	const blockProps = useBlockProps();
	const onSplitAtEnd = useGuidedEnterAtEnd( {
		blockName: 'core/description-detail',
		clientId,
	} );

	return (
		<RichText
			identifier="content"
			tagName="dd"
			{ ...blockProps }
			value={ content }
			onChange={ ( newContent: string ) =>
				setAttributes( { content: newContent } )
			}
			onMerge={ mergeBlocks }
			onReplace={ onReplace }
			onRemove={ onRemove }
			placeholder={ placeholder || __( 'Description' ) }
			__unstableOnSplitAtEnd={ onSplitAtEnd }
		/>
	);
}
