/**
 * WordPress dependencies
 */
import { useLayoutEffect, useState } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getLayoutType } from '../../layouts';

/** @typedef {import('../../selectors').WPDirectInsertBlock } WPDirectInsertBlock */

const pendingSettingsUpdates = new WeakMap();

// Creates a memoizing caching function that remembers the last value and keeps returning it
// as long as the new values are shallowly equal. Helps keep dependencies stable.
function createShallowMemo() {
	let value;
	return ( newValue ) => {
		if ( value === undefined || ! isShallowEqual( value, newValue ) ) {
			value = newValue;
		}
		return value;
	};
}

function useShallowMemo( value ) {
	const [ memo ] = useState( createShallowMemo );
	return memo( value );
}

/**
 * This hook is a side effect which updates the block-editor store when changes
 * happen to inner block settings. The given props are transformed into a
 * settings object, and if that is different from the current settings object in
 * the block-editor store, then the store is updated with the new settings which
 * came from props.
 *
 * @param {string}               clientId                   The client ID of the block to update.
 * @param {string}               parentLock
 * @param {string[]}             allowedBlocks              An array of block names which are permitted
 *                                                          in inner blocks.
 * @param {string[]}             prioritizedInserterBlocks  Block names and/or block variations to be prioritized in the inserter, in the format {blockName}/{variationName}.
 * @param {?WPDirectInsertBlock} defaultBlock               The default block to insert: [ blockName, { blockAttributes } ].
 * @param {?boolean}             directInsert               If a default block should be inserted directly by the appender.
 *
 * @param {?WPDirectInsertBlock} __experimentalDefaultBlock A deprecated prop for the default block to insert: [ blockName, { blockAttributes } ]. Use `defaultBlock` instead.
 *
 * @param {?boolean}             __experimentalDirectInsert A deprecated prop for whether a default block should be inserted directly by the appender. Use `directInsert` instead.
 *
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
	parentLock,
	allowedBlocks,
	prioritizedInserterBlocks,
	defaultBlock,
	directInsert,
	__experimentalDefaultBlock,
	__experimentalDirectInsert,
	templateLock,
	captureToolbars,
	orientation,
	layout
) {
	// Instead of adding a useSelect mapping here, please add to the useSelect
	// mapping in InnerBlocks! Every subscription impacts performance.

	const registry = useRegistry();

	// Implementors often pass a new array on every render,
	// and the contents of the arrays are just strings, so the entire array
	// can be passed as dependencies but We need to include the length of the array,
	// otherwise if the arrays change length but the first elements are equal the comparison,
	// does not works as expected.
	const _allowedBlocks = useShallowMemo( allowedBlocks );
	const _prioritizedInserterBlocks = useShallowMemo(
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
			deprecated( '__experimentalDefaultBlock', {
				alternative: 'defaultBlock',
				since: '6.3',
				version: '6.4',
			} );
			newSettings.defaultBlock = __experimentalDefaultBlock;
		}

		if ( defaultBlock !== undefined ) {
			newSettings.defaultBlock = defaultBlock;
		}

		if ( __experimentalDirectInsert !== undefined ) {
			deprecated( '__experimentalDirectInsert', {
				alternative: 'directInsert',
				since: '6.3',
				version: '6.4',
			} );
			newSettings.directInsert = __experimentalDirectInsert;
		}

		if ( directInsert !== undefined ) {
			newSettings.directInsert = directInsert;
		}

		if (
			newSettings.directInsert !== undefined &&
			typeof newSettings.directInsert !== 'boolean'
		) {
			deprecated( 'Using `Function` as a `directInsert` argument', {
				alternative: '`boolean` values',
				since: '6.5',
			} );
		}

		// Batch updates to block list settings to avoid triggering cascading renders
		// for each container block included in a tree and optimize initial render.
		// To avoid triggering updateBlockListSettings for each container block
		// causing X re-renderings for X container blocks,
		// we batch all the updatedBlockListSettings in a single "data" batch
		// which results in a single re-render.
		if ( ! pendingSettingsUpdates.get( registry ) ) {
			pendingSettingsUpdates.set( registry, {} );
		}
		pendingSettingsUpdates.get( registry )[ clientId ] = newSettings;
		window.queueMicrotask( () => {
			const settings = pendingSettingsUpdates.get( registry );
			if ( Object.keys( settings ).length ) {
				const { updateBlockListSettings } =
					registry.dispatch( blockEditorStore );
				updateBlockListSettings( settings );
				pendingSettingsUpdates.set( registry, {} );
			}
		} );
	}, [
		clientId,
		_allowedBlocks,
		_prioritizedInserterBlocks,
		_templateLock,
		defaultBlock,
		directInsert,
		__experimentalDefaultBlock,
		__experimentalDirectInsert,
		captureToolbars,
		orientation,
		layout,
		registry,
	] );
}
