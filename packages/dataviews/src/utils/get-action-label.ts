import { sprintf, _x } from '@wordpress/i18n';
import type { Action } from '../types';

// Best-effort support for legacy labels. New labels must omit the ellipsis.
// Match each dot run in full to avoid exponential backtracking.
const TRAILING_ELLIPSIS = /(?:\s*(?:[…⋯]|[.。．]{3,}(?![.。．])))+\s*$/u;

export default function getActionLabel< Item >(
	action: Action< Item >,
	items: Item[],
	context: 'button' | 'menu' = 'button'
) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );

	if ( context === 'button' ) {
		return label.replace( TRAILING_ELLIPSIS, '' );
	}

	// Preserve recognized legacy punctuation rather than adding a second ellipsis.
	if ( ! ( 'RenderModal' in action ) || TRAILING_ELLIPSIS.test( label ) ) {
		return label;
	}

	return sprintf(
		/* translators: %s: Action label. Use the ellipsis and spacing appropriate for your language. */
		_x( '%s…', 'menu item requiring further input' ),
		label
	);
}
