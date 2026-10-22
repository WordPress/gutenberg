import type { Action } from '../types';

export default function getActionButtonLabel< Item >(
	action: Action< Item >,
	items: Item[]
) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );

	// Ellipses indicate that menu items require more input, but do not belong on buttons.
	return label.replace( /(?:…|\.{3})$/, '' );
}
