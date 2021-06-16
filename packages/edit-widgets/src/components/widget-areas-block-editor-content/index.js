/**
 * WordPress dependencies
 */
import {
	BlockList,
	BlockTools,
	BlockEditorKeyboardShortcuts,
	BlockSelectionClearer,
	WritingFlow,
	ObserveTyping,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import KeyboardShortcuts from '../keyboard-shortcuts';
import { store as editWidgetsStore } from '../../store';

export default function WidgetAreasBlockEditorContent( {
	blockEditorSettings,
} ) {
	const { hasThemeStyles } = useSelect( ( select ) => ( {
		hasThemeStyles: select( editWidgetsStore ).__unstableIsFeatureActive(
			'themeStyles'
		),
	} ) );

	const styles = useMemo( () => {
		return hasThemeStyles ? blockEditorSettings.styles : [];
	}, [ blockEditorSettings, hasThemeStyles ] );

	return (
		<div className="edit-widgets-block-editor">
			<Notices />
			<BlockTools>
				<KeyboardShortcuts />
				<BlockEditorKeyboardShortcuts />
				<div className="editor-styles-wrapper">
					<EditorStyles styles={ styles } />
					<BlockSelectionClearer>
						<WritingFlow>
							<ObserveTyping>
								<BlockList className="edit-widgets-main-block-list" />
							</ObserveTyping>
						</WritingFlow>
					</BlockSelectionClearer>
				</div>
			</BlockTools>
		</div>
	);
}
