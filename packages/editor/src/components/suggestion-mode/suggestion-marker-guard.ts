/**
 * Keeps synced content from re-attributing inline suggestion markers.
 *
 * Real-time collaboration merges rich text as HTML strings, so two peers
 * marking overlapping text with the same kind come out of the merge as two
 * markers of one kind on the same characters, and a last-writer-wins
 * attribute merge can swap a marker's id. Left alone, the next write of that
 * kind flattens them and one author's marker takes the other's text.
 *
 * The local writers never produce that state: rich text applies one format
 * of a kind per character, and every marker write keeps the other kinds. So
 * the guard can run on every content change, whatever its origin, and only
 * ever acts on merged content. It resolves it with `guardMarkerIntegrity`,
 * whose rule (the older note id keeps the characters) every peer applies the
 * same way, so the corrective writes converge. The correction is not an edit:
 * it bypasses Suggestion mode's interceptor and stays off the undo stack.
 */
import { useEffect } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { RichTextData } from '@wordpress/rich-text';
import {
	guardMarkerIntegrity,
	isSuggestionFormat,
	suggestionKindOf,
} from '../inline-suggestions';
import { toRichTextRecord } from '../inline-suggestions/rich-text-record';
import { getBlockTreeVersion } from './block-tree-version';
import { useSuggestionSession } from './suggestion-session';

/**
 * Whether some character of a value carries two markers of one kind.
 *
 * @param value Rich-text value.
 * @return True when any character carries two markers of one kind.
 */
function hasSameKindOverlap( value: RichTextData ): boolean {
	return ( value.formats as any[] ).some( ( stack ) => {
		if ( ! Array.isArray( stack ) || stack.length < 2 ) {
			return false;
		}
		const kinds = stack
			.filter( isSuggestionFormat )
			.map( ( format ) => suggestionKindOf( format ) );
		return new Set( kinds ).size < kinds.length;
	} );
}

/**
 * Whether a value carries any marker.
 *
 * @param value Rich-text value.
 * @return True when a marker is present.
 */
function hasMarkers( value: RichTextData ): boolean {
	return ( value.formats as any[] ).some(
		( stack ) => Array.isArray( stack ) && stack.some( isSuggestionFormat )
	);
}

/**
 * Invisible component that guards every rich-text attribute in the editor.
 * Mounted for every intent: synced content arrives whatever the local user
 * is doing.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionMarkerGuard() {
	const registry = useRegistry();
	const { requestInterceptorBypass } = useSuggestionSession();

	useEffect( () => {
		const blockEditor = registry.select( blockEditorStore );
		let lastVersion: object | null = null;
		// The last value seen per block attribute, for the id comparison.
		const previous = new Map< string, RichTextData >();
		// Values already checked, including the guard's own corrections.
		const checked = new WeakSet< RichTextData >();

		const isPending = ( id: string ) => {
			const note: any = registry
				.select( coreStore )
				?.getEntityRecord?.( 'root', 'comment', Number( id ) );
			const lifecycle = note?.meta?._wp_suggestion_status;
			return (
				!! note &&
				note.status === 'hold' &&
				( ! lifecycle || lifecycle === 'pending' )
			);
		};

		const check = () => {
			const version = getBlockTreeVersion( blockEditor );
			if ( ! version || version === lastVersion ) {
				return;
			}
			lastVersion = version;
			for ( const clientId of blockEditor.getClientIdsWithDescendants() ) {
				const attributes = blockEditor.getBlockAttributes( clientId );
				for ( const [ key, value ] of Object.entries(
					attributes ?? {}
				) ) {
					if (
						! ( value instanceof RichTextData ) ||
						checked.has( value )
					) {
						continue;
					}
					checked.add( value );
					const slot = `${ clientId }:${ key }`;
					const before = previous.get( slot );
					previous.set( slot, value );
					/*
					 * An id swap only counts when the text is unchanged, the
					 * mark of an attribute merge; a local edit that changes
					 * text never swaps one pending marker for another.
					 */
					const swapCandidate =
						before &&
						before.text === value.text &&
						hasMarkers( value );
					if ( ! swapCandidate && ! hasSameKindOverlap( value ) ) {
						continue;
					}
					const next = toRichTextRecord( value )!;
					const guarded = guardMarkerIntegrity(
						swapCandidate ? toRichTextRecord( before )! : next,
						next,
						{ isPending }
					);
					if ( guarded === next ) {
						continue;
					}
					const fixed = new RichTextData( guarded as any );
					checked.add( fixed );
					previous.set( slot, fixed );
					const dispatch = registry.dispatch( blockEditorStore );
					requestInterceptorBypass( clientId );
					dispatch.__unstableMarkNextChangeAsNotPersistent?.();
					dispatch.updateBlockAttributes( clientId, {
						[ key ]: fixed,
					} );
				}
			}
		};

		check();
		return registry.subscribe( check, blockEditorStore );
	}, [ registry, requestInterceptorBypass ] );

	return null;
}
