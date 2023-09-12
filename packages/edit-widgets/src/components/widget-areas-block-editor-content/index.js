/**
 * WordPress dependencies
 */
import {
	BlockList,
	BlockTools,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import KeyboardShortcuts from '../keyboard-shortcuts';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockCanvas: BlockCanvas } = unlock(
	blockEditorPrivateApis
);

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
				<BlockCanvas
					shouldIframe={ false }
					styles={ styles }
					height="100%"
				>
					<BlockList className="edit-widgets-main-block-list" />
				</BlockCanvas>
			</BlockTools>
		</div>
	);
}
