import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useMergeRefs } from '@wordpress/compose';
import type { BlockEditProps, Block } from '@wordpress/blocks';
import type { RichTextData } from '@wordpress/rich-text';
import useKeyboardTransform from '../description-term/use-keyboard-transform';

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
	const keyboardTransformRef = useKeyboardTransform( {
		attributes,
		blockName: 'core/description-detail',
		clientId,
	} );
	const ref = useMergeRefs( [ blockProps.ref, keyboardTransformRef ] );

	return (
		<RichText
			identifier="content"
			tagName="dd"
			{ ...blockProps }
			ref={ ref }
			value={ content }
			onChange={ ( newContent: string ) =>
				setAttributes( { content: newContent } )
			}
			onMerge={ mergeBlocks }
			onReplace={ onReplace }
			onRemove={ onRemove }
			placeholder={ placeholder || __( 'Description' ) }
		/>
	);
}
