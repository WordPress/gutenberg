/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useStyleOverride } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { useNoteThreads } from '../collab-sidebar/hooks';
import { parseSuggestionPayload } from './provider';
import { store as editorStore } from '../../store';

/**
 * Build CSS that tints each inline suggestion marker with its author's color by
 * matching the marker's `data-author` attribute. The marker rules in
 * `content-suggestion.scss` already consume `--suggestion-author-color` (with
 * the semantic red/green as the fallback when no author is known), so setting
 * the custom property per author is all that is needed: the strikethrough /
 * underline decoration still conveys delete vs add, while the color conveys who
 * — the Google-Docs model.
 *
 * Pure so it can be unit-tested without React. One rule per distinct author
 * that actually has an inline-suggestion thread.
 *
 * @param {Array} threads Unresolved note threads (each with `author` and the
 *                        `_wp_suggestion` meta payload).
 * @return {string} Serialized CSS targeting `.wp-suggestion[data-author]`.
 */
export function buildSuggestionAuthorColorCss( threads ) {
	const seen = new Set();
	const rules = [];
	for ( const thread of threads ?? [] ) {
		const payload = parseSuggestionPayload( thread?.meta?._wp_suggestion );
		const hasInline = payload?.operations?.some(
			( op ) => op.type === 'inline-suggestion'
		);
		if ( ! hasInline ) {
			continue;
		}
		// `author` is a server-assigned user id (a non-negative integer); skip
		// anything that isn't, so the numeric value can compose the attribute
		// selector directly (no escaping needed inside the quoted value, and
		// `CSS.escape` would wrongly escape a leading digit).
		const author = thread.author;
		if ( ! Number.isInteger( author ) || author < 0 ) {
			continue;
		}
		if ( seen.has( author ) ) {
			continue;
		}
		seen.add( author );
		const color = getAvatarBorderColor( author );
		const sel = `.wp-suggestion[data-author="${ author }"]`;
		rules.push( `${ sel }{--suggestion-author-color:${ color };}` );
	}
	return rules.join( '' );
}

/**
 * Injects per-author `--suggestion-author-color` rules into the editor canvas so
 * each inline suggestion marker tints to its author. Mounted once inside the
 * suggestion overlay provider, alongside `SuggestionAnnotations`, so the tint is
 * visible to everyone viewing the post in any editor intent.
 *
 * Uses `useStyleOverride` so the rules reach the iframed canvas (a plain
 * `<style>` in the chrome would only affect the parent document).
 *
 * @return {null} Renders nothing; styles are applied via `useStyleOverride`.
 */
export default function SuggestionAuthorColors() {
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId(),
		[]
	);
	const { unresolvedNotes } = useNoteThreads( postId );
	const css = useMemo(
		() => buildSuggestionAuthorColorCss( unresolvedNotes ),
		[ unresolvedNotes ]
	);
	useStyleOverride( { id: 'core-suggestion-author-colors', css } );
	return null;
}
