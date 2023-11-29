/**
 * WordPress dependencies
 */
import {
	BlockList,
	BlockTools,
	BlockSelectionClearer,
	WritingFlow,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
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
	const { hasTopToolbar, hasThemeStyles } = useSelect( ( select ) => {
		return {
			hasTopToolbar: !! select( preferencesStore ).get(
				'core/edit-widgets',
				'fixedToolbar'
			),
			hasThemeStyles: !! select( preferencesStore ).get(
				'core/edit-widgets',
				'themeStyles'
			),
		};
	}, [] );
	const isLargeViewport = useViewportMatch( 'medium' );
	let blockToolbarDisplay = 'popover';

	if ( ! isLargeViewport ) {
		blockToolbarDisplay = 'sticky';
	} else if ( hasTopToolbar ) {
		blockToolbarDisplay = 'none';
	}

	const styles = useMemo( () => {
		return hasThemeStyles ? blockEditorSettings.styles : [];
	}, [ blockEditorSettings, hasThemeStyles ] );

	return (
		<div className="edit-widgets-block-editor">
			<Notices />
			<BlockTools
				__experimentalBlockToolbarDisplay={ blockToolbarDisplay }
			>
				<KeyboardShortcuts />
				<EditorStyles
					styles={ styles }
					scope=".editor-styles-wrapper"
				/>
				<BlockSelectionClearer>
					<WritingFlow>
						<BlockList className="edit-widgets-main-block-list" />
					</WritingFlow>
				</BlockSelectionClearer>
			</BlockTools>
		</div>
	);
}
