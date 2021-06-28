/**
 * WordPress dependencies
 */
import {
	EntitiesSavedStates,
	PostPublishPanel,
	store as editorStore,
} from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, createSlotFill } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import PluginPostPublishPanel from '../sidebar/plugin-post-publish-panel';
import PluginPrePublishPanel from '../sidebar/plugin-pre-publish-panel';
import { store as editPostStore } from '../../store';

const { Fill, Slot } = createSlotFill( 'ActionsPanel' );

export const ActionsPanelFill = Fill;

export default function ActionsPanel( {
	setEntitiesSavedStatesCallback,
	closeEntitiesSavedStates,
	isEntitiesSavedStatesOpen,
} ) {
	const { closePublishSidebar, togglePublishSidebar } = useDispatch(
		editPostStore
	);
	const {
		publishSidebarOpened,
		hasActiveMetaboxes,
		isSavingMetaBoxes,
		hasNonPostEntityChanges,
	} = useSelect( ( select ) => {
		return {
			publishSidebarOpened: select(
				editPostStore
			).isPublishSidebarOpened(),
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			isSavingMetaBoxes: select( editPostStore ).isSavingMetaBoxes(),
			hasNonPostEntityChanges: select(
				editorStore
			).hasNonPostEntityChanges(),
		};
	}, [] );

	const openEntitiesSavedStates = useCallback(
		() => setEntitiesSavedStatesCallback( true ),
		[]
	);

	// It is ok for these components to be unmounted when not in visual use.
	// We don't want more than one present at a time, decide which to render.
	let unmountableContent;
	if ( publishSidebarOpened ) {
		unmountableContent = (
			<PostPublishPanel
				onClose={ closePublishSidebar }
				forceIsDirty={ hasActiveMetaboxes }
				forceIsSaving={ isSavingMetaBoxes }
				PrePublishExtension={ PluginPrePublishPanel.Slot }
				PostPublishExtension={ PluginPostPublishPanel.Slot }
			/>
		);
	} else if ( hasNonPostEntityChanges ) {
		unmountableContent = (
			<div className="edit-post-layout__toggle-entities-saved-states-panel">
				<Button
					variant="secondary"
					className="edit-post-layout__toggle-entities-saved-states-panel-button"
					onClick={ openEntitiesSavedStates }
					aria-expanded={ false }
				>
					{ __( 'Open save panel' ) }
				</Button>
			</div>
		);
	} else {
		unmountableContent = (
			<div className="edit-post-layout__toggle-publish-panel">
				<Button
					variant="secondary"
					className="edit-post-layout__toggle-publish-panel-button"
					onClick={ togglePublishSidebar }
					aria-expanded={ false }
				>
					{ __( 'Open publish panel' ) }
				</Button>
			</div>
		);
	}

	// Since EntitiesSavedStates controls its own panel, we can keep it
	// always mounted to retain its own component state (such as checkboxes).
	return (
		<>
			{ isEntitiesSavedStatesOpen && (
				<EntitiesSavedStates close={ closeEntitiesSavedStates } />
			) }
			<Slot bubblesVirtually />
			{ ! isEntitiesSavedStatesOpen && unmountableContent }
		</>
	);
}
