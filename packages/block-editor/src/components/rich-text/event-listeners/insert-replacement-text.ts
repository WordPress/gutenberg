import { store as blockEditorStore } from '../../../store';
import type { RichTextField } from '../types';

/**
 * When the browser is about to auto correct, add an undo level so the user can
 * revert the change.
 *
 * @param field
 * @param event
 */
export function onBeforeInput( field: RichTextField, event: InputEvent ) {
	if ( event.inputType !== 'insertReplacementText' ) {
		return;
	}

	const { registry } = field.props.current;
	registry
		.dispatch( blockEditorStore )
		.__unstableMarkLastChangeAsPersistent();
}
