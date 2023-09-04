/**
 * WordPress dependencies
 */
import {
	BlockList,
	BlockTools,
	BlockSelectionClearer,
	BlockCanvas,
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
				<BlockSelectionClearer>
					<BlockCanvas shouldIframe={ false } styles={ styles }>
						<BlockList className="edit-widgets-main-block-list" />
					</BlockCanvas>
				</BlockSelectionClearer>
			</BlockTools>
		</div>
	);
}
