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
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useEnter } from './utils';

export default function ListItemEdit( props ) {
	const {
		attributes,
		setAttributes,
		name,
		onReplace,
		mergeBlocks,
		clientId,
	} = props;
	const { placeholder, content } = attributes;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/list' ],
	} );
	const useEnterRef = useEnter( { content, clientId } );
	return (
		<li { ...innerBlocksProps }>
			<RichText
				ref={ useMergeRefs( [ useEnterRef ] ) }
				identifier="content"
				tagName="div"
				onChange={ ( nextContent ) =>
					setAttributes( { content: nextContent } )
				}
				value={ content }
				aria-label={ __( 'List text' ) }
				placeholder={ placeholder || __( 'List' ) }
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
