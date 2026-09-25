import { useLayoutEffect, useRef } from '@wordpress/element';
import { useDebounce, useEvent } from '@wordpress/compose';

const TYPING_TIMEOUT = 1000;

/**
 * Classifies the change between two snapshots of the value.
 *
 * @param {Object} previous Previous snapshot.
 * @param {Object} next     Next snapshot.
 *
 * @return {'none'|'typing'|'discrete'} The change type.
 */
function getChangeType( previous, next ) {
	if (
		previous.html === next.html &&
		previous.hasActiveFormats === next.hasActiveFormats
	) {
		return 'none';
	}

	return previous.text === next.text ? 'discrete' : 'typing';
}

export function useMarkPersistent( { html, value, onMarkPersistent } ) {
	const { text } = value;
	const hasActiveFormats = !! value.activeFormats?.length;
	const previousRef = useRef();
	// Stable, so a new callback doesn't reset the debounce.
	const markPersistent = useEvent( onMarkPersistent );
	// Don't create an undo level for every character. Create one after a
	// second of no input.
	const markPersistentDebounced = useDebounce(
		markPersistent,
		TYPING_TIMEOUT
	);

	// Must be set synchronously to make sure it applies to the last change.
	useLayoutEffect( () => {
		const previous = previousRef.current;
		const next = { html, text, hasActiveFormats };

		// Ignore mount.
		if ( ! previous ) {
			previousRef.current = next;
			return;
		}

		// Effects can re-run without a change, e.g. in strict mode. Keep the
		// last handled snapshot, so html lagging behind the text (e.g. a
		// debounced `setAttributes`) still counts as typing.
		const changeType = getChangeType( previous, next );
		if ( changeType === 'none' ) {
			return;
		}

		previousRef.current = next;

		// An empty field waits for its first value, which can load later
		// (e.g. Site Title, bindings). Marking it would add an undo level.
		if ( ! previous.text ) {
			return;
		}

		if ( changeType === 'typing' ) {
			markPersistentDebounced();
			return;
		}

		markPersistentDebounced.cancel();
		markPersistent();
	}, [
		html,
		text,
		hasActiveFormats,
		markPersistent,
		markPersistentDebounced,
	] );
}
