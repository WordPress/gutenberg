/**
 * External dependencies
 */
import classnames from 'classnames';

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

function VisualEditor( { viewEditingMode } ) {
	return (
		<BlockSelectionClearer
			className={ classnames( 'edit-post-visual-editor editor-styles-wrapper', {
				'is-mode-template-part': Boolean( viewEditingMode.id ),
			} ) }
		>
			<VisualEditorGlobalKeyboardShortcuts />
			<MultiSelectScrollIntoView />
			<WritingFlow>
				<ObserveTyping>
					<CopyHandler>
						{ ! viewEditingMode.showTemplate && <PostTitle /> }
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
		viewEditingMode: getModeConfig( viewEditingMode, templateParts ),
	};
} )( VisualEditor );
