import clsx from 'clsx';
import type { ComponentType, HTMLAttributes, Ref } from 'react';
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { trash } from '@wordpress/icons';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import _BlockControls from '../../block-controls';
import _BlockToolbarLastItem from '../block-toolbar-last-item';
import { store as blockEditorStore } from '../../../store';
import BlockNameMenu from './block-name-menu';
import Movers from './movers';
import PrimaryActions from './primary-actions';
import OptionsMenu from './options-menu';
import ParentChain from './parent-chain';
import _EditSectionButton from '../edit-section-button';
import _SwitchSectionStyle from '../switch-section-style';

// Their JSDoc marks every prop as required.
const EditSectionButton = _EditSectionButton as unknown as ComponentType< {
	clientId: string;
} >;
const SwitchSectionStyle = _SwitchSectionStyle as unknown as ComponentType< {
	clientId: string;
} >;

// `BlockControls.Slot` is added at runtime, out of sight of its types.
const BlockControls = _BlockControls as unknown as {
	Slot: ComponentType< { group?: string; className?: string } >;
};
const BlockToolbarLastItem = _BlockToolbarLastItem as unknown as {
	Slot: ComponentType;
};

/**
 * Toolbar controls registered with `BlockControls` by blocks and plugins.
 * The redesign moves core's alignment, layout and formatting controls
 * elsewhere, so what's left here is mostly block-specific (Replace on an
 * image, Indent on a list) and third-party controls. Where those go long
 * term is the biggest open question of the redesign.
 */
function LegacyControls() {
	return (
		<>
			{ [ 'parent', 'block', 'default', 'inline', 'other' ].map(
				( group ) => (
					<BlockControls.Slot
						key={ group }
						group={ group === 'default' ? undefined : group }
						className="block-editor-block-toolbar__slot"
					/>
				)
			) }
			<BlockToolbarLastItem.Slot />
		</>
	);
}

function DeleteButton( { clientIds }: { clientIds: string[] } ) {
	const { canRemove, shortcut } = useSelect(
		( select ) => ( {
			canRemove: select( blockEditorStore ).canRemoveBlocks( clientIds ),
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/block-editor/remove' ),
		} ),
		[ clientIds ]
	);
	const { removeBlocks } = useDispatch( blockEditorStore );
	if ( ! canRemove ) {
		return null;
	}
	return (
		<ToolbarButton
			icon={ trash }
			label={ __( 'Delete' ) }
			shortcut={ shortcut ?? undefined }
			onClick={ () => removeBlocks( clientIds, true ) }
		/>
	);
}

/**
 * The redesigned block toolbar, behind the `gutenberg-block-toolbar-redesign`
 * experiment. In order:
 *
 * 1. Block: the block's icon, opening transforms and style presets.
 * 2. Movers: drag, move up, move down.
 * 3. Primary actions: structural actions a block keeps on top (Layout and
 *    add inside, for containers).
 * 4. Block controls registered by blocks and plugins.
 * 5. Options: everything else, in one searchable menu.
 * 6. Delete.
 *
 * The parent selector sits outside the toolbar, so the toolbar is always in
 * the same place, and text formatting has its own toolbar over selected
 * text.
 *
 * @param props                  Component props.
 * @param props.clientIds        Selected blocks.
 * @param props.showParent       Show the parent selector.
 * @param props.showControls     Show block controls from slots.
 * @param props.isFixed          The toolbar is in the top bar, not floating
 *                               over the block.
 * @param props.blockNameRef     Ref for the block name area.
 * @param props.blockNameProps   Hover and focus props that outline the block.
 * @param props.canEdit          The selected block can be edited, so a section
 *                               (an unsynced pattern) can be opened for editing.
 * @param props.showSectionStyle Show the section style switcher.
 */
export default function RedesignedBlockToolbar( {
	clientIds,
	showParent,
	showControls,
	isFixed,
	blockNameRef,
	blockNameProps,
	canEdit,
	showSectionStyle,
}: {
	clientIds: string[];
	showParent: boolean;
	showControls: boolean;
	isFixed: boolean;
	blockNameRef?: Ref< HTMLDivElement >;
	blockNameProps?: HTMLAttributes< HTMLDivElement >;
	canEdit?: boolean;
	showSectionStyle?: boolean;
} ) {
	const isSingle = clientIds.length === 1;
	return (
		<>
			{ showParent && isSingle && (
				<ParentChain clientId={ clientIds[ 0 ] } />
			) }
			<div
				ref={ blockNameRef }
				{ ...blockNameProps }
				className={ clsx(
					'block-editor-block-toolbar-redesign__block',
					{ 'is-fixed': isFixed }
				) }
			>
				<ToolbarGroup>
					<BlockNameMenu clientIds={ clientIds } />
				</ToolbarGroup>
			</div>
			<Movers clientIds={ clientIds } />
			{ isSingle && <PrimaryActions clientId={ clientIds[ 0 ] } /> }
			{ /* Labelled structural actions on sections (patterns), which
			stay top-level like the other primary actions. */ }
			{ isSingle && canEdit && (
				<EditSectionButton clientId={ clientIds[ 0 ] } />
			) }
			{ isSingle && showSectionStyle && (
				<SwitchSectionStyle clientId={ clientIds[ 0 ] } />
			) }
			{ showControls && <LegacyControls /> }
			<ToolbarGroup className="block-editor-block-toolbar-redesign__end">
				<OptionsMenu clientIds={ clientIds } />
				<DeleteButton clientIds={ clientIds } />
			</ToolbarGroup>
		</>
	);
}
