/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { isRTL, __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import {
	formatOutdent,
	formatOutdentRTL,
	formatIndentRTL,
	formatIndent,
} from '@wordpress/icons';
import { useMergeRefs } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	useEnter,
	useSpace,
	useIndentListItem,
	useOutdentListItem,
	useSplit,
	useMerge,
	useCopy,
} from './hooks';
import { convertToListItems } from './utils';

export function IndentUI( { clientId } ) {
	const indentListItem = useIndentListItem( clientId );
	const outdentListItem = useOutdentListItem();
	const { canIndent, canOutdent } = useSelect(
		( select ) => {
			const { getBlockIndex, getBlockRootClientId, getBlockName } =
				select( blockEditorStore );
			return {
				canIndent: getBlockIndex( clientId ) > 0,
				canOutdent:
					getBlockName(
						getBlockRootClientId( getBlockRootClientId( clientId ) )
					) === 'core/list-item',
			};
		},
		[ clientId ]
	);

	return (
		<>
			<ToolbarButton
				icon={ isRTL() ? formatOutdentRTL : formatOutdent }
				title={ __( 'Outdent' ) }
				describedBy={ __( 'Outdent list item' ) }
				disabled={ ! canOutdent }
				onClick={ () => outdentListItem() }
			/>
			<ToolbarButton
				icon={ isRTL() ? formatIndentRTL : formatIndent }
				title={ __( 'Indent' ) }
				describedBy={ __( 'Indent list item' ) }
				isDisabled={ ! canIndent }
				onClick={ () => indentListItem() }
			/>
		</>
	);
}

export default function ListItemEdit( {
	attributes,
	setAttributes,
	onReplace,
	clientId,
	mergeBlocks,
} ) {
	const { placeholder, content } = attributes;
	const blockProps = useBlockProps( { ref: useCopy( clientId ) } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: false,
		__unstableDisableDropZone: true,
	} );
	const useEnterRef = useEnter( { content, clientId } );
	const useSpaceRef = useSpace( clientId );
	const onSplit = useSplit( clientId );
	const onMerge = useMerge( clientId, mergeBlocks );
	return (
		<>
			<li { ...innerBlocksProps }>
				<RichText
					ref={ useMergeRefs( [ useEnterRef, useSpaceRef ] ) }
					identifier="content"
					tagName="div"
					onChange={ ( nextContent ) =>
						setAttributes( { content: nextContent } )
					}
					value={ content }
					aria-label={ __( 'List text' ) }
					placeholder={ placeholder || __( 'List' ) }
					onSplit={ onSplit }
					onMerge={ onMerge }
					onReplace={
						onReplace
							? ( blocks, ...args ) => {
									onReplace(
										convertToListItems( blocks ),
										...args
									);
							  }
							: undefined
					}
				/>
				{ innerBlocksProps.children }
			</li>
			<BlockControls group="block">
				<IndentUI clientId={ clientId } />
			</BlockControls>
		</>
	);
}
