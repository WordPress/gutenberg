/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';

const PREFERENCE_NAME = 'isInspectorControlsTabsHintVisible';

export default function InspectorControlsTabsHint() {
	const isInspectorControlsTabsHintVisible = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', PREFERENCE_NAME ) ?? true,
		[]
	);

	const ref = useRef();

	const { set: setPreference } = useDispatch( preferencesStore );
	if ( ! isInspectorControlsTabsHintVisible ) {
		return null;
	}

	return (
		<div ref={ ref } className="block-editor-inspector-controls-tabs__hint">
			<div className="block-editor-inspector-controls-tabs__hint-content">
				{ __(
					"Looking for other block settings? They've moved to the styles tab."
				) }
			</div>
			<Button
				className="block-editor-inspector-controls-tabs__hint-dismiss"
				icon={ close }
				iconSize="16"
				label={ __( 'Dismiss hint' ) }
				onClick={ () => {
					// Retain focus when dismissing the element.
					const previousElement = focus.tabbable.findPrevious(
						ref.current
					);
					previousElement?.focus();
					setPreference( 'core', PREFERENCE_NAME, false );
				} }
				showTooltip={ false }
			/>
		</div>
	);
}
