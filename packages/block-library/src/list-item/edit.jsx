import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { isRTL, __ } from '@wordpress/i18n';
import {
	ToolbarButton,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	formatOutdent,
	formatOutdentRTL,
	formatIndentRTL,
	formatIndent,
} from '@wordpress/icons';
import { useMergeRefs } from '@wordpress/compose';
import { useSelect, useRegistry } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';
import { InputControl } from '@wordpress/ui';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { useEnter, useTab, useMultiSelectTab, useMerge } from './hooks';
import {
	indentListItems,
	outdentListItems,
	getIndentTarget,
	getOutdentTarget,
} from './utils';

// A number input also accepts these characters, none of which belong in a
// whole number.
const BLOCKED_KEYS = [ 'e', 'E', '+', '.', ',' ];

export function IndentUI( { clientId } ) {
	const registry = useRegistry();
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
				onClick={ () => outdentListItems( registry ) }
			/>
			<ToolbarButton
				icon={ isRTL() ? formatIndentRTL : formatIndent }
				title={ __( 'Indent' ) }
				shortcut="Tab"
				description={ __( 'Indent list item' ) }
				disabled={ ! canIndent }
				onClick={ () => indentListItems( registry, clientId ) }
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
	const { placeholder, content, value } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const isOrdered = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockAttributes } =
				select( blockEditorStore );
			return !! getBlockAttributes( getBlockRootClientId( clientId ) )
				?.ordered;
		},
		[ clientId ]
	);
	const blockProps = useBlockProps( { value: value || undefined } );
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
			{ isOrdered && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () => setAttributes( { value: undefined } ) }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							label={ __( 'Custom number' ) }
							isShownByDefault
							hasValue={ () => !! value }
							onDeselect={ () =>
								setAttributes( { value: undefined } )
							}
						>
							<InputControl
								label={ __( 'Custom number' ) }
								description={ __(
									'The following items continue counting from here.'
								) }
								type="number"
								step={ 1 }
								value={ value ?? '' }
								onKeyDown={ ( event ) => {
									if ( BLOCKED_KEYS.includes( event.key ) ) {
										event.preventDefault();
									}
								} }
								onBlur={ ( event ) => {
									if ( event.target.validity.badInput ) {
										event.target.value = '';
									}
								} }
								onValueChange={ ( nextValue ) => {
									// Clearing the field unsets the value.
									if ( nextValue === '' ) {
										setAttributes( { value: undefined } );
										return;
									}
									// Ignore anything that is not a whole number.
									// Comparing with the number's own string form also
									// rejects input like "1e3" and "05" that would
									// otherwise parse as whole numbers.
									const number = Number( nextValue );
									if (
										Number.isInteger( number ) &&
										String( number ) === nextValue
									) {
										setAttributes( { value: nextValue } );
									}
								} }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
			) }
		</>
	);
}
