import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { STORE_NAME } from '../name';
import type { store as coreStore } from '../';
import useEntityId from './use-entity-id';
import { updateFootnotesFromMeta } from '../footnotes';
import { getCachedBlocks, setCachedBlocks } from '../parsed-blocks-cache';
import type {
	EntityBlockEditorChangeOptions,
	EntityBlockEditorOptions,
	EntityBlockEditorRecord,
	EntityBlockEditorResult,
} from './types';

const EMPTY_ARRAY: Array< Block > = [];

/**
 * Hook that returns block content getters and setters for
 * the nearest provided entity of the specified type.
 *
 * The return value has the shape `[ blocks, onInput, onChange ]`.
 * `onInput` is for block changes that don't create undo levels
 * or dirty the post, non-persistent changes, and `onChange` is for
 * persistent changes. They map directly to the props of a
 * `BlockEditorProvider` and are intended to be used with it,
 * or similar components or hooks.
 *
 * @param kind       The entity kind.
 * @param name       The entity name.
 * @param options
 * @param options.id An entity ID to use instead of the context-provided one.
 *
 * @return The block array and setters.
 */
export default function useEntityBlockEditor(
	kind: string,
	name: string,
	{ id: _id }: EntityBlockEditorOptions = {}
): EntityBlockEditorResult {
	const providerId = useEntityId( kind, name );
	const id = _id ?? providerId;
	const { content, editedBlocks, meta } = useSelect(
		( select ) => {
			if ( ! id ) {
				return {};
			}
			// The store is selected by name, which carries no store types.
			const { getEditedEntityRecord } = select(
				STORE_NAME as unknown as typeof coreStore
			);
			// A missing record is `false`, whose fields read as `undefined`.
			const editedRecord = getEditedEntityRecord(
				kind,
				name,
				id
			) as EntityBlockEditorRecord;
			return {
				editedBlocks: editedRecord.blocks,
				content: editedRecord.content,
				meta: editedRecord.meta,
			};
		},
		[ kind, name, id ]
	);
	const { __unstableCreateUndoLevel, editEntityRecord } =
		// The store is selected by name, which carries no store types.
		useDispatch( STORE_NAME as unknown as typeof coreStore );

	const blocks = useMemo( () => {
		if ( ! id ) {
			return undefined;
		}

		if ( editedBlocks ) {
			return editedBlocks;
		}

		if ( ! content || typeof content !== 'string' ) {
			return EMPTY_ARRAY;
		}

		// The cache validates the content and the registered block types, so
		// an entry parsed from other content — or before the block types were
		// registered, as happens when a record resolves while the editor's
		// assets are still loading — is re-parsed instead of adopted.
		let _blocks = getCachedBlocks( kind, name, id, content );

		if ( ! _blocks ) {
			_blocks = parse( content );
			setCachedBlocks( kind, name, id, content, _blocks );
		}

		return _blocks;
	}, [ kind, name, id, editedBlocks, content ] );

	const onChange = useCallback(
		(
			newBlocks: Array< Block >,
			options: EntityBlockEditorChangeOptions
		): Promise< unknown > | void => {
			const noChange = blocks === newBlocks;
			if ( noChange ) {
				return __unstableCreateUndoLevel(
					// @ts-expect-error Bug: the action takes no arguments, so the entity is ignored.
					kind,
					name,
					id
				);
			}
			const { selection, ...rest } = options;

			// We create a new function here on every persistent edit
			// to make sure the edit makes the post dirty and creates
			// a new undo level.
			const edits = {
				selection,
				content: ( {
					blocks: blocksForSerialization = [],
				}: {
					blocks?: Array< Block >;
				} ) => __unstableSerializeAndClean( blocksForSerialization ),
				...updateFootnotesFromMeta( newBlocks, meta ),
			};

			editEntityRecord( kind, name, id, edits, {
				isCached: false,
				...rest,
			} );
		},
		[
			kind,
			name,
			id,
			blocks,
			meta,
			__unstableCreateUndoLevel,
			editEntityRecord,
		]
	);

	const onInput = useCallback(
		(
			newBlocks: Array< Block >,
			options: EntityBlockEditorChangeOptions
		) => {
			const { selection, ...rest } = options;
			const edits = {
				selection,
				...updateFootnotesFromMeta( newBlocks, meta ),
			};

			editEntityRecord( kind, name, id, edits, {
				isCached: true,
				...rest,
			} );
		},
		[ kind, name, id, meta, editEntityRecord ]
	);

	return [ blocks, onInput, onChange ];
}
