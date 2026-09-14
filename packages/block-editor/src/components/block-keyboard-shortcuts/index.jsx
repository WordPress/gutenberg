import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { store as blocksStore, switchToBlockType } from '@wordpress/blocks';
import warning from '@wordpress/warning';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Returns every keyboard shortcut declared by a registered block type, through
 * either a block variation or a block transform.
 *
 * @return {Array} Declared shortcuts, each paired with the block change it makes.
 */
function useDeclaredBlockShortcuts() {
	return useSelect(
		( select ) =>
			unlock( select( blocksStore ) ).getBlockKeyboardShortcuts(),
		[]
	);
}

/**
 * Returns a callback applying a block-declared shortcut to the selected block.
 *
 * The callback reports whether the shortcut was relevant to the current
 * selection, which is not the same as whether the block changed: a shortcut
 * that resolves to the block's current state is still handled, so that the key
 * combination is swallowed rather than typed into the block.
 *
 * @return {Function} Callback receiving a declared shortcut.
 */
function useApplyBlockShortcut() {
	const {
		getBlock,
		getBlockName,
		getBlockAttributes,
		getBlockEditingMode,
		getSelectedBlockClientId,
	} = useSelect( blockEditorStore );
	const { getBlockVariations, getActiveBlockVariation } =
		useSelect( blocksStore );
	const { replaceBlocks, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	return useCallback(
		( { targetBlockName, blockNames, variationName } ) => {
			const clientId = getSelectedBlockClientId();
			if ( ! clientId ) {
				return false;
			}

			// Transforming a block is a structural change, so it is only
			// allowed where the block is fully editable.
			if ( getBlockEditingMode( clientId ) !== 'default' ) {
				return false;
			}

			const blockName = getBlockName( clientId );
			if ( ! blockNames.includes( blockName ) ) {
				return false;
			}

			const variation = variationName
				? getBlockVariations( targetBlockName )?.find(
						( { name } ) => name === variationName
				  )
				: undefined;

			// The block is already of the target type, so there is nothing to
			// transform. Applying the variation's attributes is all that is
			// left to do.
			if ( blockName === targetBlockName ) {
				if ( ! variation?.attributes ) {
					return false;
				}
				const activeVariation = getActiveBlockVariation(
					targetBlockName,
					getBlockAttributes( clientId )
				);
				if ( activeVariation?.name !== variationName ) {
					updateBlockAttributes( clientId, variation.attributes );
				}
				return true;
			}

			const block = getBlock( clientId );
			if ( ! block ) {
				return false;
			}

			// Prefer a transform declared for this specific variation, and
			// fall back to transforming to the block type and applying the
			// variation's attributes on top.
			let blocks = variation
				? switchToBlockType( block, targetBlockName, variation.name )
				: null;

			if ( ! blocks ) {
				blocks = switchToBlockType( block, targetBlockName );

				if ( blocks && variation?.attributes ) {
					blocks = blocks.map( ( newBlock ) =>
						newBlock.name === targetBlockName
							? {
									...newBlock,
									attributes: {
										...newBlock.attributes,
										...variation.attributes,
									},
							  }
							: newBlock
					);
				}
			}

			if ( ! blocks ) {
				return false;
			}

			replaceBlocks( clientId, blocks );
			return true;
		},
		[
			getBlock,
			getBlockName,
			getBlockAttributes,
			getBlockEditingMode,
			getSelectedBlockClientId,
			getBlockVariations,
			getActiveBlockVariation,
			replaceBlocks,
			updateBlockAttributes,
		]
	);
}

function BlockShortcut( { entry, apply } ) {
	useShortcut( entry.name, ( event ) => {
		// Another handler already acted on this event: either a shortcut
		// claiming the same key combination, or this same shortcut mounted
		// twice because block editor providers can be nested.
		if ( event.defaultPrevented ) {
			return;
		}

		if ( apply( entry ) ) {
			event.preventDefault();
		}
	} );

	return null;
}

function BlockShortcutsRegister( { shortcuts } ) {
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);
	// Shortcuts registered by a previous run, keyed by name, so that those
	// belonging to a block type that has since been unregistered can be
	// removed. Registration deliberately outlives this component: providers can
	// be nested, and unmounting one of them must not take the shortcuts away
	// from the others.
	const registeredRef = useRef( new Map() );

	useEffect( () => {
		const registered = new Map();
		const combinations = new Map();

		for ( const shortcut of shortcuts ) {
			const config = {
				name: shortcut.name,
				category: 'block',
				description: shortcut.description,
				keyCombination: shortcut.keyCombination,
				aliases: shortcut.aliases,
			};
			const serialized = JSON.stringify( config );

			// One shortcut is declared once per block change it can make, so
			// the same name legitimately appears more than once: the heading
			// level shortcuts are declared both on the variation, for a
			// heading, and on the transform that produces one from a
			// paragraph. Only declarations that disagree are a mistake, since
			// the store keys shortcuts by name and the last one registered
			// would decide what the others are matched against.
			const previous = registered.get( shortcut.name );
			if ( previous !== undefined ) {
				if ( previous !== serialized ) {
					warning(
						`Block keyboard shortcut "${ shortcut.name }" is declared more than once with different settings.`
					);
				}
				continue;
			}

			// Handlers are matched by key combination rather than by name, so
			// two shortcuts claiming the same one both run on the same event,
			// in registration order, and the first that applies takes it.
			const { modifier, character } = shortcut.keyCombination;
			const combination = `${ modifier ?? '' }+${ character }`;
			if ( combinations.has( combination ) ) {
				warning(
					`Block keyboard shortcut "${
						shortcut.name
					}" uses the same key combination as "${ combinations.get(
						combination
					) }".`
				);
			}
			combinations.set( combination, shortcut.name );

			registerShortcut( config );
			registered.set( shortcut.name, serialized );
		}

		for ( const name of registeredRef.current.keys() ) {
			if ( ! registered.has( name ) ) {
				unregisterShortcut( name );
			}
		}

		registeredRef.current = registered;
	}, [ shortcuts, registerShortcut, unregisterShortcut ] );

	return null;
}

/**
 * Registers and handles the keyboard shortcuts that blocks declare on their
 * variations and transforms, applying them to the selected block.
 *
 * @return {Element} Element.
 */
export default function BlockKeyboardShortcuts() {
	const shortcuts = useDeclaredBlockShortcuts();
	const apply = useApplyBlockShortcut();

	return (
		<>
			<BlockShortcutsRegister shortcuts={ shortcuts } />
			{ shortcuts.map( ( entry, index ) => (
				<BlockShortcut
					// Shortcut names are not guaranteed to be unique across
					// blocks, so the index keeps the list stable.
					key={ `${ entry.name }-${ index }` }
					entry={ entry }
					apply={ apply }
				/>
			) ) }
		</>
	);
}
