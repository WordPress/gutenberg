/**
 * External dependencies
 */
import { flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { KeyboardShortcuts } from '@wordpress/components';

const preventDefault = ( event ) => {
	event.preventDefault();
	return event;
};

export function BlockSettingsKeyboardShortcuts( { onDuplicate, onRemove, shortcuts } ) {
	return (
		<KeyboardShortcuts
			bindGlobal
			shortcuts={ {
				[ shortcuts.duplicate.raw ]: flow( preventDefault, onDuplicate ),
				[ shortcuts.remove.raw ]: flow( preventDefault, onRemove ),
			} }
		/>
	);
}

export default BlockSettingsKeyboardShortcuts;
