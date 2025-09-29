/**
 * WordPress dependencies
 */
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { Button, createSlotFill } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import EntitiesSavedStates from '../entities-saved-states';
import PostPublishPanel from '../post-publish-panel';
import PluginPrePublishPanel from '../plugin-pre-publish-panel';
import PluginPostPublishPanel from '../plugin-post-publish-panel';
import { store as editorStore } from '../../store';

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
		isPublishable,
		isDirty,
		hasOtherEntitiesChanges,
	} = useSelect( ( select ) => {
		const {
			isPublishSidebarOpened,
			isEditedPostPublishable,
			isCurrentPostPublished,
			isEditedPostDirty,
			hasNonPostEntityChanges,
		} = select( editorStore );
		const _hasOtherEntitiesChanges = hasNonPostEntityChanges();
		return {
			publishSidebarOpened: isPublishSidebarOpened(),
			isPublishable:
				! isCurrentPostPublished() && isEditedPostPublishable(),
			isDirty: _hasOtherEntitiesChanges || isEditedPostDirty(),
			hasOtherEntitiesChanges: _hasOtherEntitiesChanges,
		};
	}, [] );

	const openEntitiesSavedStates = useCallback(
		() => setEntitiesSavedStatesCallback( true ),
		[]
	);

	const registry = useRegistry();

	useEffect( () => {
		addAction(
			'editor.savePost',
			'my-plugin/template-save-dialog',
			async ( post, options ) => {
				if ( options.isAutosave ) {
					return;
				}
				if ( post.type !== 'wp_template' ) {
					return;
				}

				const site = await registry
					.select( coreStore )
					.getEntityRecord( 'root', 'site' );
				const template = await registry
					.select( coreStore )
					.getEditedEntityRecord( 'postType', post.type, post.id );
				const editorSettings = await registry
					.select( editorStore )
					.getEditorSettings();

				// Don't open for focused entity.
				if ( editorSettings.onNavigateToPreviousEntityRecord ) {
					return;
				}

				// Already active
				if ( site.active_templates[ template.slug ] === post.id ) {
					return;
				}

				registry.dispatch( editorStore ).openPublishSidebar();
			}
		);

		return () => {
			removeAction( 'editor.savePost', 'my-plugin/template-save-dialog' );
		};
	}, [ registry ] );

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
	} else if ( isPublishable && ! hasOtherEntitiesChanges ) {
		unmountableContent = (
			<div className="editor-layout__toggle-publish-panel">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ togglePublishSidebar }
					aria-expanded={ false }
				>
					{ __( 'Open publish panel' ) }
				</Button>
			</div>
		);
	} else {
		unmountableContent = (
			<div className="editor-layout__toggle-entities-saved-states-panel">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ openEntitiesSavedStates }
					aria-expanded={ false }
					aria-haspopup="dialog"
					disabled={ ! isDirty }
					accessibleWhenDisabled
				>
					{ __( 'Open save panel' ) }
				</Button>
			</div>
		);
	}

	// Since EntitiesSavedStates controls its own panel, we can keep it
	// always mounted to retain its own component state (such as checkboxes).
	return (
		<>
			{ isEntitiesSavedStatesOpen && (
				<EntitiesSavedStates
					close={ closeEntitiesSavedStates }
					renderDialog
				/>
			) }
			<Slot bubblesVirtually />
			{ ! isEntitiesSavedStatesOpen && unmountableContent }
		</>
	);
}
