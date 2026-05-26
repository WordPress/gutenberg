/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../name';
import useEntityId from './use-entity-id';
import { updateFootnotesFromMeta } from '../footnotes';
import { parsedBlocksCache, getCacheKey } from '../parsed-blocks-cache';

const EMPTY_ARRAY = [];

/**
 * Hook that returns block content getters and setters for
 * the nearest provided entity of the specified type.
 *
 * The return value has the shape `[ blocks, onInput, onChange, options ]`.
 * `onInput` is for block changes that don't create undo levels
 * or dirty the post, non-persistent changes, and `onChange` is for
 * persistent changes.
 *
 * Prefer `__unstableUseEntityBlockEditorProps` when passing entity blocks to a
 * controlled block editor surface like `BlockEditorProvider`, `InnerBlocks`, or
 * `useInnerBlocksProps`. Use this lower-level tuple hook when a component only
 * needs to inspect blocks or call one of the returned callbacks.
 *
 * @param {string} kind         The entity kind.
 * @param {string} name         The entity name.
 * @param {Object} options
 * @param {string} [options.id] An entity ID to use instead of the context-provided one.
 *
 * @return {[unknown[], Function, Function, Object]} The block array, setters, and block editor options.
 */
export default function useEntityBlockEditor( kind, name, { id: _id } = {} ) {
	const providerId = useEntityId( kind, name );
	const id = _id ?? providerId;
	const { blockEditSource, content, editedBlocks, meta } = useSelect(
		( select ) => {
			if ( ! id ) {
				return {};
			}
			const {
				__unstableGetEntityRecordBlockEditSource,
				getEditedEntityRecord,
			} = select( STORE_NAME );
			const editedRecord = getEditedEntityRecord( kind, name, id );
			return {
				blockEditSource: __unstableGetEntityRecordBlockEditSource(
					kind,
					name,
					id
				),
				editedBlocks: editedRecord.blocks,
				content: editedRecord.content,
				meta: editedRecord.meta,
			};
		},
		[ kind, name, id ]
	);
	const { __unstableCreateUndoLevel, editEntityRecord } =
		useDispatch( STORE_NAME );

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

		// Cache parsed blocks by entity identity. Store the content
		// alongside the blocks so we can validate it hasn't changed.
		const cacheKey = getCacheKey( kind, name, id );
		const cached = parsedBlocksCache.get( cacheKey );
		let _blocks;

		if ( cached && cached.content === content ) {
			_blocks = cached.blocks;
		} else {
			_blocks = parse( content );
			parsedBlocksCache.set( cacheKey, { content, blocks: _blocks } );
		}

		return _blocks;
	}, [ kind, name, id, editedBlocks, content ] );

	const onChange = useCallback(
		( newBlocks, options ) => {
			const noChange = blocks === newBlocks;
			if ( noChange ) {
				return __unstableCreateUndoLevel( kind, name, id );
			}
			const { selection, ...rest } = options;

			// We create a new function here on every persistent edit
			// to make sure the edit makes the post dirty and creates
			// a new undo level.
			const edits = {
				selection,
				content: ( { blocks: blocksForSerialization = [] } ) =>
					__unstableSerializeAndClean( blocksForSerialization ),
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
		( newBlocks, options ) => {
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

	const options = useMemo(
		() => ( {
			__unstableIsRemoteSynced:
				blockEditSource === 'remote-sync' && blocks === editedBlocks,
		} ),
		[ blockEditSource, blocks, editedBlocks ]
	);

	return [ blocks, onInput, onChange, options ];
}

/**
 * Hook that returns the spreadable block editor props for an entity record.
 *
 * This is a convenience wrapper around `useEntityBlockEditor` for controlled
 * block editor surfaces. Prefer this helper when passing entity-backed blocks
 * to `BlockEditorProvider`, `InnerBlocks`, or `useInnerBlocksProps`, so callers
 * receive the full prop bundle including private editor sync metadata. The
 * returned object includes both `blocks` for local reads and `value` for
 * spreading into controlled block editor APIs.
 *
 * @param {string} kind    The entity kind.
 * @param {string} name    The entity name.
 * @param {Object} options Hook options.
 *
 * @return {Object} Block editor props.
 */
function useEntityBlockEditorProps( kind, name, options ) {
	const [ blocks, onInput, onChange, { __unstableIsRemoteSynced } = {} ] =
		useEntityBlockEditor( kind, name, options );

	return useMemo(
		() => ( {
			blocks,
			value: blocks,
			onInput,
			onChange,
			__unstableIsRemoteSynced,
		} ),
		[ blocks, onInput, onChange, __unstableIsRemoteSynced ]
	);
}

export { useEntityBlockEditorProps as __unstableUseEntityBlockEditorProps };
