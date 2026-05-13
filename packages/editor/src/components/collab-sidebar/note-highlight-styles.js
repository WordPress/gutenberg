/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor } from './utils';

// Hex alpha suffixes for the rest / active states. Kept low so the marker
// reads as a soft tint at rest and gets noticeably stronger when focused or
// hovered. (0x40 ≈ 25%, 0x80 ≈ 50%.)
const REST_ALPHA = '40';
const ACTIVE_ALPHA = '80';

/**
 * Emits a `<style>` element with per-note background rules so inline-note
 * markers carry their author's avatar color. The annotations API renders each
 * marker with `id="annotation-text-{noteId}"`, which we target directly.
 *
 * Opacity boosts on `:hover`, `:focus-within`, and when the matching thread is
 * the editor's selected note.
 *
 * @param {Object}      props
 * @param {Array}       props.threads      Unresolved note threads.
 * @param {string|null} [props.selectedId] ID of the currently selected note.
 * @return {JSX.Element|null} The style element or `null` when there are no threads.
 */
export function NoteHighlightStyles( { threads, selectedId } ) {
	const css = useMemo( () => {
		if ( ! threads?.length ) {
			return '';
		}
		const rules = [];
		for ( const thread of threads ) {
			if ( ! thread?.id ) {
				continue;
			}
			const color = getAvatarBorderColor( thread.author ?? 0 );
			const sel = `#annotation-text-${ thread.id }`;
			rules.push(
				`${ sel }{background-color:${ color }${ REST_ALPHA };}`
			);
			rules.push(
				`${ sel }:hover,${ sel }:focus-within{background-color:${ color }${ ACTIVE_ALPHA };}`
			);
			if ( selectedId && String( selectedId ) === String( thread.id ) ) {
				rules.push(
					`${ sel }{background-color:${ color }${ ACTIVE_ALPHA };}`
				);
			}
		}
		return rules.join( '' );
	}, [ threads, selectedId ] );

	if ( ! css ) {
		return null;
	}
	return <style>{ css }</style>;
}
