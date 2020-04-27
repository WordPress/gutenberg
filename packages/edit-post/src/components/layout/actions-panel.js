/**
 * WordPress dependencies
 */
import { EntitiesSavedStates, PostPublishPanel } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PluginPostPublishPanel from '../sidebar/plugin-post-publish-panel';
import PluginPrePublishPanel from '../sidebar/plugin-pre-publish-panel';

export default function ActionsPanel() {
	const {
		closePublishSidebar,
		togglePublishSidebar,
		closeEntitiesSavedStates,
		openEntitiesSavedStates,
	} = useDispatch( 'core/edit-post' );
	const {
		publishSidebarOpened,
		hasActiveMetaboxes,
		isSaving,
		isEntitiesSavedStatesOpen,
		hasNonPostEntityChanges,
	} = useSelect( ( select ) => {
		return {
			publishSidebarOpened: select(
				'core/edit-post'
			).isPublishSidebarOpened(),
			hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
			isSaving: select( 'core/edit-post' ).isSavingMetaBoxes(),
			isEntitiesSavedStatesOpen: select(
				'core/edit-post'
			).isEntitiesSavedStatesOpen(),
			hasNonPostEntityChanges: select(
				'core/editor'
			).hasNonPostEntityChanges(),
		};
	}, [] );

	const openSavePanel = useCallback( () => openEntitiesSavedStates(), [] );

	// It is ok for these components to be unmounted when not in visual use.
	// So we can use them in a return cascade since only 1 is to be present at a time.
	const Unmountables = () => {
		if ( publishSidebarOpened ) {
			return (
				<PostPublishPanel
					onClose={ closePublishSidebar }
					forceIsDirty={ hasActiveMetaboxes }
					forceIsSaving={ isSaving }
					PrePublishExtension={ PluginPrePublishPanel.Slot }
					PostPublishExtension={ PluginPostPublishPanel.Slot }
				/>
			);
		}

		if ( hasNonPostEntityChanges ) {
			return (
				<div className="edit-post-layout__toggle-publish-panel">
					<Button
						isSecondary
						className="edit-post-layout__toggle-publish-panel-button"
						onClick={ openSavePanel }
						aria-expanded={ false }
					>
						{ __( 'Open save panel' ) }
					</Button>
				</div>
			);
		}

		return (
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
	};

	// Since EntitiesSavedStates controls its own panel, we can keep it
	// always mounted to retain its own component state (such as checkboxes).
	return (
		<>
			<EntitiesSavedStates
				isOpen={ isEntitiesSavedStatesOpen }
				closePanel={ closeEntitiesSavedStates }
			/>
			{ ! isEntitiesSavedStatesOpen && <Unmountables /> }
		</>
	);
}
