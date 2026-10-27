/**
 * Keeps synced content from re-attributing inline suggestion markers.
 *
 * Real-time collaboration merges rich text as HTML strings, so two peers
 * marking overlapping text come out of the merge as stacked markers in
 * whatever order the merge produced, possibly with one marker repeated, and a
 * last-writer-wins attribute merge can swap a marker's id.
 *
 * The local writers always leave stacks in canonical order. So the guard can
 * run on every content change, whatever its origin, and only ever acts on
 * merged content. It resolves it with `guardSyncedValue`: canonical order,
 * swapped ids restored, and markers dropped when they are empty or their id
 * is not a suggestion on this post. One peer writes each correction (see
 * `guardSyncedValue`), so the corrective writes converge. The correction is
 * not an edit: it bypasses Suggestion mode's interceptor and stays off the
 * undo stack.
 */
import { useEffect } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { RichTextData } from '@wordpress/rich-text';
import { guardSyncedValue } from '../inline-suggestions';
import { toRichTextRecord } from '../inline-suggestions/rich-text-record';
import { store as editorStore } from '../../store';
import { getBlockTreeVersion } from './block-tree-version';
import { useSuggestionSession } from './suggestion-session';

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

		// Slots holding an id whose note is still being looked up, with the
		// value they held before it arrived, to check again once it is.
		const awaiting = new Map< string, RichTextData | undefined >();
		const rechecking = new Map< string, RichTextData | undefined >();
		let lookingUp = false;

		/*
		 * Only a lookup that answered settles it: the note exists on another
		 * post, or the server has no such comment. A failed request or a
		 * note not loaded yet is not proof, since a peer's marker can arrive
		 * before its note.
		 */
		const isForeign = ( id: string ) => {
			const core: any = registry.select( coreStore );
			if ( ! core?.getEntityRecord ) {
				return false;
			}
			const args = [ 'root', 'comment', Number( id ) ];
			const note =
				core.__experimentalGetEntityRecordNoResolver( ...args ) ??
				core.getEntityRecord( ...args );
			if ( note ) {
				const postId = registry
					.select( editorStore )
					.getCurrentPostId();
				return (
					( note.post !== undefined && note.post !== postId ) ||
					( note.type !== undefined && note.type !== 'note' )
				);
			}
			if ( ! core.hasFinishedResolution( 'getEntityRecord', args ) ) {
				lookingUp = true;
				return false;
			}
			const error: any = core.getResolutionError?.(
				'getEntityRecord',
				args
			);
			return (
				error?.code === 'rest_comment_invalid_id' ||
				error?.data?.status === 404
			);
		};

		const userId = () => {
			const id = registry.select( coreStore )?.getCurrentUser?.()?.id;
			return id ? String( id ) : undefined;
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
					const before = rechecking.has( slot )
						? rechecking.get( slot )
						: previous.get( slot );
					previous.set( slot, value );
					lookingUp = false;
					const guarded = guardSyncedValue(
						before && toRichTextRecord( before )!,
						toRichTextRecord( value )!,
						{ isPending, isForeign, userId: userId() }
					);
					if ( lookingUp ) {
						awaiting.set( slot, before );
					}
					if ( ! guarded ) {
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

		// A lookup that settled can make a marker foreign: check its slot
		// again, against what it held before the marker arrived.
		const recheck = () => {
			if ( ! awaiting.size ) {
				return;
			}
			rechecking.clear();
			for ( const [ pending, before ] of awaiting ) {
				rechecking.set( pending, before );
				const [ clientId, key ] = pending.split( ':' );
				const value =
					blockEditor.getBlockAttributes( clientId )?.[ key ];
				if ( value instanceof RichTextData ) {
					checked.delete( value );
				}
			}
			awaiting.clear();
			lastVersion = null;
			check();
			rechecking.clear();
		};

		check();
		const unsubscribeBlocks = registry.subscribe( check, blockEditorStore );
		const unsubscribeCore = registry.subscribe( recheck, coreStore );
		return () => {
			unsubscribeBlocks();
			unsubscribeCore();
		};
	}, [ registry, requestInterceptorBypass ] );

	return null;
}
