/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	EntitiesSavedStates,
	PostPublishPanel,
	PluginPrePublishPanel,
	PluginPostPublishPanel,
	store as editorStore,
} from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, createSlotFill } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { NavigableRegion } from '@wordpress/interface';

const { Fill, Slot } = createSlotFill( 'PublishPanel' );

export const ActionsPanelFill = Fill;

// TODO: check how/when to close the panel after specific actions..
// Example I observed:
// 1. From draft->publish
// 2. Edit status to draft and save
// 3. Publish panel is open..

// TODO: This is equivalent to ActionsPanel in edit-post and we'll need
// to revisit when we see what to with the metaBoxes(hasActiveMetaboxes).
export default function PublishPanel( {
	setEntitiesSavedStatesCallback,
	closeEntitiesSavedStates,
	isEntitiesSavedStatesOpen,
} ) {
	const { closePublishSidebar, togglePublishSidebar } =
		useDispatch( editorStore );
	const { publishSidebarOpened, hasNonPostEntityChanges } = useSelect(
		( select ) => ( {
			publishSidebarOpened:
				select( editorStore ).isPublishSidebarOpened(),
			hasNonPostEntityChanges:
				select( editorStore ).hasNonPostEntityChanges(),
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
				PrePublishExtension={ PluginPrePublishPanel.Slot }
				PostPublishExtension={ PluginPostPublishPanel.Slot }
			/>
		);
	} else if ( hasNonPostEntityChanges ) {
		// TODO: this is now never used..
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
		// TODO: update css classes if I'll need to iterate and consolidate
		// ActionsPanel(edit-post) and PublishPanel(this one).
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
		<NavigableRegion
			className={ classnames( 'edit-site-layout__actions', {
				'is-entity-save-view-open': isEntitiesSavedStatesOpen,
				'is-publish-sidebar-open': publishSidebarOpened,
			} ) }
			ariaLabel={ __( 'Publish' ) }
		>
			{ isEntitiesSavedStatesOpen && (
				<EntitiesSavedStates close={ closeEntitiesSavedStates } />
			) }
			<Slot bubblesVirtually />
			{ ! isEntitiesSavedStatesOpen && unmountableContent }
		</NavigableRegion>
	);
}
