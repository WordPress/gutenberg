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

const EMPTY_ARRAY = [];
const parsedBlocksCache = new Map();

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
 * @param {string} kind         The entity kind.
 * @param {string} name         The entity name.
 * @param {Object} options
 * @param {string} [options.id] An entity ID to use instead of the context-provided one.
 *
 * @return {[unknown[], Function, Function]} The block array and setters.
 */
export default function useEntityBlockEditor( kind, name, { id: _id } = {} ) {
	const providerId = useEntityId( kind, name );
	const id = _id ?? providerId;
	const { content, editedBlocks, meta } = useSelect(
		( select ) => {
			if ( ! id ) {
				return {};
			}
			const { getEditedEntityRecord } = select( STORE_NAME );
			const editedRecord = getEditedEntityRecord( kind, name, id );
			return {
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
		const cacheKey = `${ kind }:${ name }:${ id }`;
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

	return [ blocks, onInput, onChange ];
}
