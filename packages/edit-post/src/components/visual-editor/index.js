/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	PostTitle,
	VisualEditorGlobalKeyboardShortcuts,
} from '@wordpress/editor';
import {
	WritingFlow,
	Typewriter,
	ObserveTyping,
	BlockList,
	CopyHandler,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
	__experimentalBlockSettingsMenuFirstItem,
	__experimentalBlockSettingsMenuPluginsExtension,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockInspectorButton from './block-inspector-button';
import PluginBlockSettingsMenuGroup from '../block-settings-menu/plugin-block-settings-menu-group';

function VisualEditor() {
	const isLargeViewport = useViewportMatch( 'medium' );
	const isFocusMode = useSelect( ( select ) =>
		select( 'core/edit-post' ).isFeatureActive( 'focusMode' )
	);
	const className = classnames( 'edit-post-visual-editor editor-styles-wrapper', {
		'is-focus-mode': isLargeViewport && isFocusMode,
	} );

	return (
		<BlockSelectionClearer className={ className }>
			<VisualEditorGlobalKeyboardShortcuts />
			<MultiSelectScrollIntoView />
			<Popover.Slot name="block-toolbar" />
			<Typewriter>
				<CopyHandler>
					<WritingFlow>
						<ObserveTyping>
							<CopyHandler>
								<PostTitle />
								<BlockList />
							</CopyHandler>
						</ObserveTyping>
					</WritingFlow>
				</CopyHandler>
			</Typewriter>
			<__experimentalBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => <BlockInspectorButton onClick={ onClose } /> }
			</__experimentalBlockSettingsMenuFirstItem>
			<__experimentalBlockSettingsMenuPluginsExtension>
				{ ( { clientIds, onClose } ) => <PluginBlockSettingsMenuGroup.Slot fillProps={ { clientIds, onClose } } /> }
			</__experimentalBlockSettingsMenuPluginsExtension>
		</BlockSelectionClearer>
	);
}

export default VisualEditor;
