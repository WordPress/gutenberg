import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
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
import { flushSync } from '@wordpress/element';
import { useSelect, useRegistry } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';
import { useEnter, useTab, useMultiSelectTab, useMerge } from './hooks';
import { unlock } from '../lock-unlock';
import {
	indentListItems,
	outdentListItems,
	getIndentTarget,
	getOutdentTarget,
} from './utils';

const { useBlockElement, focusSelectedField } = unlock(
	blockEditorPrivateApis
);

/**
 * Runs a toolbar action that moves the item, then returns focus to the
 * item's text, the way format buttons return focus after they act. The item
 * re-mounts inside its new list, so it is looked up again after the update.
 *
 * @param {Object}   registry      Data registry.
 * @param {Function} action        Store action to run.
 * @param {Document} ownerDocument Document holding the item.
 */
function actAndRefocus( registry, action, ownerDocument ) {
	flushSync( action );
	focusSelectedField(
		ownerDocument,
		registry.select( blockEditorStore ).getSelectionStart()
	);
}

export function IndentUI( { clientId } ) {
	const registry = useRegistry();
	const blockElement = useBlockElement( clientId );
	const { canIndent, canOutdent } = useSelect(
		( select ) => {
			const storeSelect = select( blockEditorStore );
			return {
				canIndent: !! getIndentTarget( storeSelect, clientId ),
				canOutdent: !! getOutdentTarget( storeSelect, clientId ),
			};
		},
		[ clientId ]
	);

	return (
		<>
			<ToolbarButton
				icon={ isRTL() ? formatOutdentRTL : formatOutdent }
				title={ __( 'Outdent' ) }
				shortcut={ displayShortcut.shift( 'Tab' ) }
				description={ __( 'Outdent list item' ) }
				disabled={ ! canOutdent }
				onClick={ () =>
					actAndRefocus(
						registry,
						() => outdentListItems( registry ),
						blockElement.ownerDocument
					)
				}
			/>
			<ToolbarButton
				icon={ isRTL() ? formatIndentRTL : formatIndent }
				title={ __( 'Indent' ) }
				shortcut="Tab"
				description={ __( 'Indent list item' ) }
				disabled={ ! canIndent }
				onClick={ () =>
					actAndRefocus(
						registry,
						() => indentListItems( registry, clientId ),
						blockElement.ownerDocument
					)
				}
			/>
		</>
	);
}

export default function ListItemEdit( {
	attributes,
	setAttributes,
	clientId,
	mergeBlocks,
} ) {
	const { placeholder, content } = attributes;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: false,
		__unstableDisableDropZone: true,
	} );
	const useEnterRef = useEnter( clientId );
	const useTabRef = useTab();
	const useMultiSelectTabRef = useMultiSelectTab( clientId );
	const onMerge = useMerge( clientId, mergeBlocks );
	return (
		<>
			<li { ...innerBlocksProps }>
				<RichText
					ref={ useMergeRefs( [
						useEnterRef,
						useTabRef,
						useMultiSelectTabRef,
					] ) }
					identifier="content"
					tagName="div"
					onChange={ ( nextContent ) =>
						setAttributes( { content: nextContent } )
					}
					value={ content }
					aria-label={ __( 'List text' ) }
					placeholder={ placeholder || __( 'List' ) }
					onMerge={ onMerge }
				/>
				{ innerBlocksProps.children }
			</li>
			<BlockControls group="block">
				<IndentUI clientId={ clientId } />
			</BlockControls>
		</>
	);
}
