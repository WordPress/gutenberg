/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';

const PREFERENCE_NAME = 'isInspectorControlsTabsPointerVisible';

export default function InspectorControlsTabsPointer() {
	const isInspectorControlsTabsPointerVisible = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', PREFERENCE_NAME ) ?? true,
		[]
	);

	const { set: setPreference } = useDispatch( preferencesStore );
	if ( ! isInspectorControlsTabsPointerVisible ) {
		return null;
	}

	return (
		<div className="block-editor-inspector-controls-tabs__pointer">
			<div className="block-editor-inspector-controls-tabs__pointer-content">
				{ __(
					"Looking for other block settings? They've moved to the styles tab."
				) }
			</div>
			<Button
				className="block-editor-inspector-controls-tabs__pointer-dismiss"
				icon={ close }
				iconSize="16"
				label={ __( 'Dismiss' ) }
				onClick={ () => {
					setPreference( 'core', PREFERENCE_NAME, false );
				} }
				showTooltip={ false }
			/>
		</div>
	);
}
