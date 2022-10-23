/**
 * WordPress dependencies
 */
import {
	BlockList,
	BlockTools,
	BlockSelectionClearer,
	WritingFlow,
	ObserveTyping,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import KeyboardShortcuts from '../keyboard-shortcuts';

export default function WidgetAreasBlockEditorContent( {
	blockEditorSettings,
} ) {
	const hasThemeStyles = useSelect(
		( select ) =>
			!! select( preferencesStore ).get(
				'core/edit-widgets',
				'themeStyles'
			),
		[]
	);

	const styles = useMemo( () => {
		return hasThemeStyles ? blockEditorSettings.styles : [];
	}, [ blockEditorSettings, hasThemeStyles ] );

	return (
		<div className="edit-widgets-block-editor">
			<Notices />
			<BlockTools>
				<KeyboardShortcuts />
				<EditorStyles styles={ styles } />
				<BlockSelectionClearer>
					<WritingFlow>
						<ObserveTyping>
							<BlockList className="edit-widgets-main-block-list" />
						</ObserveTyping>
					</WritingFlow>
				</BlockSelectionClearer>
			</BlockTools>
		</div>
	);
}
