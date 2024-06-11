/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, createSlotFill } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EntitiesSavedStates from '../entities-saved-states';
import PostPublishPanel from '../post-publish-panel';
import PluginPrePublishPanel from '../plugin-pre-publish-panel';
import PluginPostPublishPanel from '../plugin-post-publish-panel';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Fill, Slot } = createSlotFill( 'ActionsPanel' );

export const ActionsPanelFill = Fill;

export default function SavePublishPanels( {
	setEntitiesSavedStatesCallback,
	closeEntitiesSavedStates,
	isEntitiesSavedStatesOpen,
	forceIsDirtyPublishPanel,
} ) {
	const { closePublishSidebar, togglePublishSidebar } =
		useDispatch( editorStore );
	const {
		publishSidebarOpened,
		hasNonPostEntityChanges,
		hasPostMetaChanges,
	} = useSelect(
		( select ) => ( {
			publishSidebarOpened:
				select( editorStore ).isPublishSidebarOpened(),
			hasNonPostEntityChanges:
				select( editorStore ).hasNonPostEntityChanges(),
			hasPostMetaChanges: unlock(
				select( editorStore )
			).hasPostMetaChanges(),
		} ),
		[]
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
				forceIsDirty={ forceIsDirtyPublishPanel }
				PrePublishExtension={ PluginPrePublishPanel.Slot }
				PostPublishExtension={ PluginPostPublishPanel.Slot }
			/>
		);
	} else if ( hasNonPostEntityChanges || hasPostMetaChanges ) {
		unmountableContent = (
			<div className="editor-layout__toggle-entities-saved-states-panel">
				<Button
					variant="secondary"
					className="editor-layout__toggle-entities-saved-states-panel-button"
					onClick={ openEntitiesSavedStates }
					aria-expanded={ false }
				>
					{ __( 'Open save panel' ) }
				</Button>
			</div>
		);
	} else {
		unmountableContent = (
			<div className="editor-layout__toggle-publish-panel">
				<Button
					variant="secondary"
					className="editor-layout__toggle-publish-panel-button"
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
