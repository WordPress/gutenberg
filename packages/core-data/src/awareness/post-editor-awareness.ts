/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { BaseAwarenessState, baseEqualityFieldChecks } from './base-awareness';
import { getBlockPathInYdoc, resolveBlockClientIdByPath } from './block-lookup';
import { AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS } from './config';
import { areSelectionsStatesEqual } from '../utils/crdt-user-selections';
import { createSelectionSubscription } from './selection/create-selection-subscription';

import { SelectionType } from '../types';
import type { ResolvedSelection, SelectionState } from '../types';
import type { YBlocks } from '../utils/crdt-blocks';
import type {
	DebugCollaboratorData,
	EditorState,
	PostEditorState,
	SerializableYItem,
	YDocDebugData,
} from './types';

export class PostEditorAwareness extends BaseAwarenessState< PostEditorState > {
	protected equalityFieldChecks = {
		...baseEqualityFieldChecks,
		editorState: this.areEditorStatesEqual,
	};

	private selectionSubscription: { unsubscribe: () => void } | null = null;

	public constructor(
		doc: Y.Doc,
		private kind: string,
		private name: string,
		private postId: number
	) {
		super( doc );
	}

	protected onSetUp(): void {
		super.onSetUp();

		// Clean up any prior subscription before creating a new one.
		if ( this.selectionSubscription ) {
			this.selectionSubscription.unsubscribe();
		}

		this.selectionSubscription = createSelectionSubscription(
			this.doc,
			this.kind,
			this.name,
			this.postId,
			( selectionState ) => {
				this.setThrottledLocalStateField(
					'editorState',
					{ selection: selectionState },
					AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS
				);
			}
		);
	}

	/**
	 * Check if two editor states are equal.
	 *
	 * @param state1 - The first editor state.
	 * @param state2 - The second editor state.
	 * @return True if the editor states are equal, false otherwise.
	 */
	private areEditorStatesEqual(
		state1?: EditorState,
		state2?: EditorState
	): boolean {
		if ( ! state1 || ! state2 ) {
			return state1 === state2;
		}

		return areSelectionsStatesEqual( state1.selection, state2.selection );
	}

	/**
	 * Resolve a SelectionState (which uses Y.RelativePositions) to absolute
	 * positions that the rendering layer can use.
	 *
	 * - Title selections: resolves to a text index within the title Y.Text.
	 * - WholeBlock selections: resolves the block's relative position and
	 *   finds the local clientId via tree path.
	 * - Text-based selections (Cursor, SelectionInOneBlock,
	 *   SelectionInMultipleBlocks): navigates up from the resolved Y.Text
	 *   via AbstractType.parent to find the containing block, then resolves
	 *   the local clientId via the block's tree path.
	 *
	 * Tree-path resolution is used instead of reading the clientId directly
	 * from the Yjs block because the local block-editor store may use
	 * different clientIds (e.g. in "Show Template" mode where blocks are
	 * cloned).
	 *
	 * @param selection - The selection state.
	 * @return The resolved selection with absolute positions.
	 */
	public convertSelectionStateToAbsolute(
		selection: SelectionState
	): ResolvedSelection {
		if ( selection.type === SelectionType.None ) {
			return { type: 'block', textIndex: null, localClientId: null };
		}

		if ( selection.type === SelectionType.Title ) {
			const cursorPos = selection.cursorPosition;
			const absolutePosition =
				Y.createAbsolutePositionFromRelativePosition(
					cursorPos.relativePosition,
					this.doc
				);

			if ( ! absolutePosition ) {
				return { type: 'title', textIndex: null };
			}

			return {
				type: 'title',
				textIndex: absolutePosition.index,
			};
		}

		if ( selection.type === SelectionType.WholeBlock ) {
			const absolutePos = Y.createAbsolutePositionFromRelativePosition(
				selection.blockPosition,
				this.doc
			);

			let localClientId: string | null = null;

			if ( absolutePos && absolutePos.type instanceof Y.Array ) {
				const parentArray = absolutePos.type as YBlocks;
				const block = parentArray.get( absolutePos.index );

				if ( block instanceof Y.Map ) {
					const path = getBlockPathInYdoc( block );
					localClientId = path
						? resolveBlockClientIdByPath( path )
						: null;
				}
			}

			return { type: 'block', textIndex: null, localClientId };
		}

		// Text-based selections: resolve cursor position and navigate up.
		const cursorPos =
			'cursorPosition' in selection
				? selection.cursorPosition
				: selection.cursorStartPosition;

		const absolutePosition = Y.createAbsolutePositionFromRelativePosition(
			cursorPos.relativePosition,
			this.doc
		);

		if ( ! absolutePosition ) {
			return { type: 'block', textIndex: null, localClientId: null };
		}

		// Navigate up: Y.Text -> attributes Y.Map -> block Y.Map
		const yType = absolutePosition.type.parent?.parent;
		const path =
			yType instanceof Y.Map ? getBlockPathInYdoc( yType ) : null;
		const localClientId = path ? resolveBlockClientIdByPath( path ) : null;

		return {
			type: 'block',
			textIndex: absolutePosition.index,
			localClientId,
		};
	}

	/**
	 * Type guard to check if a struct is a Y.Item (not Y.GC)
	 * @param struct - The struct to check.
	 * @return True if the struct is a Y.Item, false otherwise.
	 */
	private isYItem( struct: Y.Item | Y.GC ): struct is Y.Item {
		return 'content' in struct;
	}

	/**
	 * Get data for debugging, using the awareness state.
	 *
	 * @return {YDocDebugData} The debug data.
	 */
	public getDebugData(): YDocDebugData {
		const ydoc = this.doc;

		// Manually extract doc data to avoid deprecated toJSON method
		const docData: Record< string, unknown > = Object.fromEntries(
			Array.from( ydoc.share, ( [ key, value ] ) => [
				key,
				value.toJSON(),
			] )
		);

		// Build collaboratorMap from awareness store (all collaborators seen this session)
		const collaboratorMapData = new Map< string, DebugCollaboratorData >(
			Array.from( this.getSeenStates().entries() ).map(
				( [ clientId, collaboratorState ] ) => [
					String( clientId ),
					{
						name: collaboratorState.collaboratorInfo.name,
						wpUserId: collaboratorState.collaboratorInfo.id,
					},
				]
			)
		);

		// Serialize Yjs client items to avoid deep nesting
		const serializableClientItems: Record<
			number,
			Array< SerializableYItem >
		> = {};

		ydoc.store.clients.forEach( ( structs, clientId ) => {
			// Filter for Y.Item only (skip Y.GC garbage collection structs)
			const items = structs.filter( this.isYItem );

			serializableClientItems[ clientId ] = items.map( ( item ) => {
				const { left, right, ...rest } = item;

				return {
					...rest,
					left: left
						? {
								id: left.id,
								length: left.length,
								origin: left.origin,
								content: left.content,
						  }
						: null,
					right: right
						? {
								id: right.id,
								length: right.length,
								origin: right.origin,
								content: right.content,
						  }
						: null,
				};
			} );
		} );

		return {
			doc: docData,
			clients: serializableClientItems,
			collaboratorMap: Object.fromEntries( collaboratorMapData ),
		};
	}
}
