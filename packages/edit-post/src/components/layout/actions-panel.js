/**
 * WordPress dependencies
 */
import { EntitiesSavedStates, PostPublishPanel } from '@wordpress/editor';
import { useSelect, useStoreSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import PluginPostPublishPanel from '../sidebar/plugin-post-publish-panel';
import PluginPrePublishPanel from '../sidebar/plugin-pre-publish-panel';

export default function ActionsPanel( {
	setEntitiesSavedStatesCallback,
	closeEntitiesSavedStates,
	isEntitiesSavedStatesOpen,
} ) {
	const { closePublishSidebar, togglePublishSidebar } = useDispatch(
		'core/edit-post'
	);
	const {
		publishSidebarOpened,
		hasMetaBoxes: hasActiveMetaboxes,
		isSavingMetaBoxes,
	} = useStoreSelect( 'core/edit-post', [
		'isPublishSidebarOpened',
		'hasMetaBoxes',
		'isSavingMetaBoxes',
	] );

	const { hasNonPostEntityChanges } = useStoreSelect(
		'core/editor',
		( x ) => ( {
			hasNonPostEntityChanges: x.hasNonPostEntityChanges(),
		} )
	);

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
					isSecondary
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
					isSecondary
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
			<EntitiesSavedStates
				isOpen={ isEntitiesSavedStatesOpen }
				close={ closeEntitiesSavedStates }
			/>
			{ ! isEntitiesSavedStatesOpen && unmountableContent }
		</>
	);
}
