/**
 * WordPress dependencies
 */
import {
	RegistryProvider,
	useRegistry,
	useSelect,
	useDispatch,
} from '@wordpress/data';
import { useMemo, useEffect } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import useSiteEditorSettings from '../use-site-editor-settings';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

function hasAttributeSynced( registry, block ) {
	return registry
		.select( blocksStore )
		.hasBlockSupport( block.name, '__experimentalPattern' );
}

function recursivelyAddId( registry, blocks ) {
	return blocks.map( ( block ) => ( {
		...block,
		attributes: hasAttributeSynced( registry, block )
			? {
					...block.attributes,
					metadata: {
						...( block.attributes.metadata ?? {} ),
						id: window.crypto.randomUUID(),
					},
			  }
			: block.attributes,
		innerBlocks: recursivelyAddId( block.innerBlocks ),
	} ) );
}

const insertBlocks =
	( blocks, ...args ) =>
	( { registry, dispatch } ) => {
		return dispatch.insertBlocks(
			recursivelyAddId( registry, blocks ),
			...args
		);
	};
const replaceBlocks =
	( clientIds, blocks, ...args ) =>
	( { registry, dispatch } ) => {
		return dispatch.replaceBlocks(
			clientIds,
			recursivelyAddId( registry, blocks ),
			...args
		);
	};

export default function PatternEditorProvider( { children } ) {
	const registry = useRegistry();

	const settings = useSiteEditorSettings();

	const { templateType } = useSelect( ( select ) => {
		const { getEditedPostType } = unlock( select( editSiteStore ) );

		return {
			templateType: getEditedPostType(),
		};
	}, [] );
	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const { getClientIdsWithDescendants, getBlock } =
		useSelect( blockEditorStore );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);
	const hasBlocks = blocks.length > 0;

	useEffect( () => {
		if ( hasBlocks ) {
			const initialBlockClientIds = getClientIdsWithDescendants();
			const updates = {};
			initialBlockClientIds.forEach( ( clientId, index ) => {
				const block = getBlock( clientId );
				if (
					hasAttributeSynced( registry, block ) &&
					! block.attributes.metadata?.id
				) {
					updates[ clientId ] = {
						metadata: {
							...( block.attributes.metadata ?? {} ),
							id: index + 1,
						},
					};
				}
			} );
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( Object.keys( updates ), updates, true );
		}
	}, [
		hasBlocks,
		getClientIdsWithDescendants,
		getBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
		registry,
	] );

	const subRegistry = useMemo( () => {
		return {
			...registry,
			dispatch( store ) {
				if (
					store !== blockEditorStore &&
					store !== blockEditorStore.name
				) {
					return registry.dispatch( store );
				}
				const select = registry.select( store );
				const dispatch = registry.dispatch( store );
				return {
					...dispatch,
					insertBlocks( ...args ) {
						return insertBlocks( ...args )( {
							registry,
							select,
							dispatch,
						} );
					},
					replaceBlocks( ...args ) {
						return replaceBlocks( ...args )( {
							registry,
							select,
							dispatch,
						} );
					},
				};
			},
		};
	}, [ registry ] );

	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			<RegistryProvider value={ subRegistry }>
				{ children }
			</RegistryProvider>
		</ExperimentalBlockEditorProvider>
	);
}
