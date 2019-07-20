/**
 * WordPress dependencies
 */
import {
	withSelect,
} from '@wordpress/data';
import {
	PostTitle,
	VisualEditorGlobalKeyboardShortcuts,
	getModeConfig,
} from '@wordpress/editor';
import {
	WritingFlow,
	ObserveTyping,
	BlockList,
	CopyHandler,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
	__experimentalBlockSettingsMenuFirstItem,
	__experimentalBlockSettingsMenuPluginsExtension,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import BlockInspectorButton from './block-inspector-button';
import PluginBlockSettingsMenuGroup from '../block-settings-menu/plugin-block-settings-menu-group';

function VisualEditor( { hasPostTitle } ) {
	return (
		<BlockSelectionClearer className="edit-post-visual-editor editor-styles-wrapper">
			<VisualEditorGlobalKeyboardShortcuts />
			<MultiSelectScrollIntoView />
			<WritingFlow>
				<ObserveTyping>
					<CopyHandler>
						{ hasPostTitle && <PostTitle /> }
						<BlockList />
					</CopyHandler>
				</ObserveTyping>
			</WritingFlow>
			<__experimentalBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => <BlockInspectorButton onClick={ onClose } /> }
			</__experimentalBlockSettingsMenuFirstItem>
			<__experimentalBlockSettingsMenuPluginsExtension>
				{ ( { clientIds, onClose } ) => <PluginBlockSettingsMenuGroup.Slot fillProps={ { clientIds, onClose } } /> }
			</__experimentalBlockSettingsMenuPluginsExtension>
		</BlockSelectionClearer>
	);
}

export default withSelect( ( select ) => {
	const { getViewEditingMode, getEditorSettings } = select( 'core/editor' );
	const viewEditingMode = getViewEditingMode();
	const templateParts = getEditorSettings().templateParts;
	return {
		hasPostTitle: ! getModeConfig( viewEditingMode, templateParts ).showTemplate,
	};
} )( VisualEditor );
