import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { useStyleOverride } from '@wordpress/block-editor';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { useNoteThreads } from '../collab-sidebar/hooks';
import { parseSuggestionPayload } from './provider';
import { store as editorStore } from '../../store';

/**
 * Collect the distinct authors that actually have an inline-suggestion thread,
 * mapped to their display name (empty string when the server did not send one).
 *
 * @param {Array} threads Unresolved note threads.
 * @return {Map<number, string>} Author id to display name, in thread order.
 */
function getInlineSuggestionAuthors( threads ) {
	const authors = new Map();
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
		/*
		 * Keep the first name that is actually a name. `author_name` is
		 * absent on some responses, and memoizing the empty string would drop
		 * every marker this author owns back to the anonymous announcement
		 * even when a later thread names them.
		 */
		if ( authors.get( author ) ) {
			continue;
		}
		authors.set( author, decodeEntities( thread.author_name ?? '' ) );
	}
	return authors;
}

/**
 * Escape a display name for use inside a double-quoted CSS string. Names are
 * user-supplied, so a stray quote or backslash would otherwise break out of the
 * `content` value and corrupt the injected stylesheet.
 *
 * @param {string} value Decoded display name.
 * @return {string} Value safe to place between double quotes.
 */
function escapeCssString( value ) {
	return value.replace( /[\\"]/g, '\\$&' ).replace( /[\n\r]+/g, ' ' );
}

/**
 * Build CSS that names the suggester in the screen-reader announcements
 * bracketing each inline marker. `content-suggestion.scss` paints a generic
 * "Start of suggested addition." from the marker's `data-` attributes; these
 * rules are more specific and replace it with the authored version, so a
 * screen-reader user gets the same "who" that sighted reviewers get from the
 * per-author tint above.
 *
 * Pure so it can be unit-tested without React.
 *
 * @param {Array} threads Unresolved note threads (each with `author`,
 *                        `author_name` and the `_wp_suggestion` meta payload).
 * @return {string} Serialized CSS targeting `.wp-suggestion-a11y` pseudo-elements.
 */
export function buildSuggestionAuthorAnnouncementCss( threads ) {
	const announcements = {
		add: [
			/* translators: %s: Name of the person who made the suggestion. */
			__( 'Start of suggested addition by %s.' ),
			/* translators: %s: Name of the person who made the suggestion. */
			__( 'End of suggested addition by %s.' ),
		],
		del: [
			/* translators: %s: Name of the person who made the suggestion. */
			__( 'Start of suggested deletion by %s.' ),
			/* translators: %s: Name of the person who made the suggestion. */
			__( 'End of suggested deletion by %s.' ),
		],
		format: [
			/* translators: %s: Name of the person who made the suggestion. */
			__( 'Start of suggested formatting change by %s.' ),
			/* translators: %s: Name of the person who made the suggestion. */
			__( 'End of suggested formatting change by %s.' ),
		],
	};
	const rules = [];
	for ( const [ author, name ] of getInlineSuggestionAuthors( threads ) ) {
		if ( ! name ) {
			continue;
		}
		for ( const [ type, [ start, end ] ] of Object.entries(
			announcements
		) ) {
			const sel =
				`.wp-suggestion[data-author="${ author }"]` +
				`[data-suggestion-type="${ type }"] .wp-suggestion-a11y`;
			rules.push(
				`${ sel }::before{content:"${ escapeCssString(
					sprintf( start, name )
				) }";}`,
				`${ sel }::after{content:"${ escapeCssString(
					sprintf( end, name )
				) }";}`
			);
		}
	}
	return rules.join( '' );
}

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
	const rules = [];
	for ( const author of getInlineSuggestionAuthors( threads ).keys() ) {
		const color = getAvatarBorderColor( author );
		const sel = `.wp-suggestion[data-author="${ author }"]`;
		rules.push( `${ sel }{--suggestion-author-color:${ color };}` );
	}
	return rules.join( '' );
}

/**
 * Injects the per-author rules for inline suggestion markers into the editor
 * canvas: `--suggestion-author-color` so each marker tints to its author, and
 * the matching screen-reader announcement so the same "who" is available
 * without sight. Mounted once inside the suggestion overlay provider, alongside
 * `SuggestionAnnotations`, so both are present for everyone viewing the post in
 * any editor intent.
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
		() =>
			buildSuggestionAuthorColorCss( unresolvedNotes ) +
			buildSuggestionAuthorAnnouncementCss( unresolvedNotes ),
		[ unresolvedNotes ]
	);
	useStyleOverride( { id: 'core-suggestion-author-colors', css } );
	return null;
}
