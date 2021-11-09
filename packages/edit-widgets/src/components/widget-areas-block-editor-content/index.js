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
import { store as interfaceStore } from '@wordpress/interface';

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
			select( interfaceStore ).isFeatureActive(
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
