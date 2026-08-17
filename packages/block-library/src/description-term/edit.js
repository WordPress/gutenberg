import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useMergeRefs } from '@wordpress/compose';
import useKeyboardTransform from './use-keyboard-transform';

export default function Edit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	onRemove,
	clientId,
} ) {
	const { content, placeholder } = attributes;
	const blockProps = useBlockProps();
	const keyboardTransformRef = useKeyboardTransform( {
		attributes,
		blockName: 'core/description-term',
		clientId,
	} );
	const ref = useMergeRefs( [ blockProps.ref, keyboardTransformRef ] );

	return (
		<RichText
			identifier="content"
			tagName="dt"
			{ ...blockProps }
			ref={ ref }
			value={ content }
			onChange={ ( newContent ) =>
				setAttributes( { content: newContent } )
			}
			onMerge={ mergeBlocks }
			onReplace={ onReplace }
			onRemove={ onRemove }
			placeholder={ placeholder || __( 'Term' ) }
		/>
	);
}
