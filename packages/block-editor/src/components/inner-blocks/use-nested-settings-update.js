/**
 * WordPress dependencies
 */
import { useLayoutEffect, useMemo } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getLayoutType } from '../../layouts';

/** @typedef {import('../../selectors').WPDirectInsertBlock } WPDirectInsertBlock */

const pendingSettingsUpdates = new WeakMap();

/**
 * This hook is a side effect which updates the block-editor store when changes
 * happen to inner block settings. The given props are transformed into a
 * settings object, and if that is different from the current settings object in
 * the block-editor store, then the store is updated with the new settings which
 * came from props.
 *
 * @param {string}               clientId                   The client ID of the block to update.
 * @param {string[]}             allowedBlocks              An array of block names which are permitted
 *                                                          in inner blocks.
 * @param {string[]}             prioritizedInserterBlocks  Block names and/or block variations to be prioritized in the inserter, in the format {blockName}/{variationName}.
 * @param {?WPDirectInsertBlock} __experimentalDefaultBlock The default block to insert: [ blockName, { blockAttributes } ].
 * @param {?Function|boolean}    __experimentalDirectInsert If a default block should be inserted directly by the
 *                                                          appender.
 * @param {string}               [templateLock]             The template lock specified for the inner
 *                                                          blocks component. (e.g. "all")
 * @param {boolean}              captureToolbars            Whether or children toolbars should be shown
 *                                                          in the inner blocks component rather than on
 *                                                          the child block.
 * @param {string}               orientation                The direction in which the block
 *                                                          should face.
 * @param {Object}               layout                     The layout object for the block container.
 */
export default function useNestedSettingsUpdate(
	clientId,
	allowedBlocks,
	prioritizedInserterBlocks,
	__experimentalDefaultBlock,
	__experimentalDirectInsert,
	templateLock,
	captureToolbars,
	orientation,
	layout
) {
	const { updateBlockListSettings } = useDispatch( blockEditorStore );
	const registry = useRegistry();

	const { parentLock } = useSelect(
		( select ) => {
			const rootClientId =
				select( blockEditorStore ).getBlockRootClientId( clientId );
			return {
				parentLock:
					select( blockEditorStore ).getTemplateLock( rootClientId ),
			};
		},
		[ clientId ]
	);

	// Memoize allowedBlocks and prioritisedInnerBlocks based on the contents
	// of the arrays. Implementors often pass a new array on every render,
	// and the contents of the arrays are just strings, so the entire array
	// can be passed as dependencies.

	const _allowedBlocks = useMemo(
		() => allowedBlocks,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		allowedBlocks
	);

	const _prioritizedInserterBlocks = useMemo(
		() => prioritizedInserterBlocks,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		prioritizedInserterBlocks
	);

	const _templateLock =
		templateLock === undefined || parentLock === 'contentOnly'
			? parentLock
			: templateLock;

	useLayoutEffect( () => {
		const newSettings = {
			allowedBlocks: _allowedBlocks,
			prioritizedInserterBlocks: _prioritizedInserterBlocks,
			templateLock: _templateLock,
		};

		// These values are not defined for RN, so only include them if they
		// are defined.
		if ( captureToolbars !== undefined ) {
			newSettings.__experimentalCaptureToolbars = captureToolbars;
		}

		// Orientation depends on layout,
		// ideally the separate orientation prop should be deprecated.
		if ( orientation !== undefined ) {
			newSettings.orientation = orientation;
		} else {
			const layoutType = getLayoutType( layout?.type );
			newSettings.orientation = layoutType.getOrientation( layout );
		}

		if ( __experimentalDefaultBlock !== undefined ) {
			newSettings.__experimentalDefaultBlock = __experimentalDefaultBlock;
		}

		if ( __experimentalDirectInsert !== undefined ) {
			newSettings.__experimentalDirectInsert = __experimentalDirectInsert;
		}

		// Batch updates to block list settings to avoid triggering cascading renders
		// for each container block included in a tree and optimize initial render.
		// To avoid triggering updateBlockListSettings for each container block
		// causing X re-renderings for X container blocks,
		// we batch all the updatedBlockListSettings in a single "data" batch
		// which results in a single re-render.
		if ( ! pendingSettingsUpdates.get( registry ) ) {
			pendingSettingsUpdates.set( registry, [] );
		}
		pendingSettingsUpdates
			.get( registry )
			.push( [ clientId, newSettings ] );
		window.queueMicrotask( () => {
			if ( pendingSettingsUpdates.get( registry )?.length ) {
				registry.batch( () => {
					pendingSettingsUpdates
						.get( registry )
						.forEach( ( args ) => {
							updateBlockListSettings( ...args );
						} );
					pendingSettingsUpdates.set( registry, [] );
				} );
			}
		} );
	}, [
		clientId,
		_allowedBlocks,
		_prioritizedInserterBlocks,
		_templateLock,
		__experimentalDefaultBlock,
		__experimentalDirectInsert,
		captureToolbars,
		orientation,
		updateBlockListSettings,
		layout,
		registry,
	] );
}
