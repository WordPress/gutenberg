/**
 * WordPress dependencies
 */
import { KeyboardShortcuts } from '@wordpress/components';

export function BlockSettingsKeyboardShortcuts( { onDuplicate, onRemove, shortcuts } ) {
	return (
		<KeyboardShortcuts
			bindGlobal
			shortcuts={ {
				[ shortcuts.duplicate.raw ]: onDuplicate,
				[ shortcuts.remove.raw ]: () => {
					onRemove();
				},
				[ shortcuts.removeSecondary.raw ]: () => {
					onRemove();
				},
			} }
		/>
	);
}

export default BlockSettingsKeyboardShortcuts;
