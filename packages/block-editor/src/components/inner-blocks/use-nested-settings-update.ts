import { useLayoutEffect, useState } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { isShallowEqual } from '@wordpress/is-shallow-equal';
import type { DataRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { getLayoutType } from '../../layouts';
import type { BlockListSettings, SettingsByClientId } from '../../store/types';
import type { Layout } from '../../layouts/types';
import type { DirectInsert, DirectInsertBlock } from './types';

const pendingSettingsUpdates = new WeakMap<
	DataRegistry,
	SettingsByClientId
>();

// Creates a memoizing caching function that remembers the last value and keeps returning it
// as long as the new values are shallowly equal. Helps keep dependencies stable.
function createShallowMemo< T >() {
	let value: T | undefined;
	return ( newValue: T ) => {
		if ( value === undefined || ! isShallowEqual( value, newValue ) ) {
			value = newValue;
		}
		return value;
	};
}

function useShallowMemo< T >( value: T ) {
	const [ memo ] = useState( createShallowMemo< T > );
	return memo( value );
}

/**
 * This hook is a side effect which updates the block-editor store when changes
 * happen to inner block settings. The given props are transformed into a
 * settings object, and if that is different from the current settings object in
 * the block-editor store, then the store is updated with the new settings which
 * came from props.
 *
 * @param clientId                   The client ID of the block to update.
 * @param parentLock
 * @param allowedBlocks              An array of block names which are permitted
 *                                   in inner blocks.
 * @param prioritizedInserterBlocks  Block names and/or block variations to be prioritized in the inserter, in the format {blockName}/{variationName}.
 * @param defaultBlock               The default block to insert: [ blockName, { blockAttributes } ].
 * @param directInsert               If a default block should be inserted directly by the appender.
 *
 * @param __experimentalDefaultBlock A deprecated prop for the default block to insert: [ blockName, { blockAttributes } ]. Use `defaultBlock` instead.
 *
 * @param __experimentalDirectInsert A deprecated prop for whether a default block should be inserted directly by the appender. Use `directInsert` instead.
 *
 * @param templateLock               The template lock specified for the inner
 *                                   blocks component. (e.g. "all")
 * @param captureToolbars            Whether or children toolbars should be shown
 *                                   in the inner blocks component rather than on
 *                                   the child block.
 * @param orientation                The direction in which the block
 *                                   should face.
 * @param layout                     The layout object for the block container.
 */
export default function useNestedSettingsUpdate(
	clientId: string,
	parentLock: string | false | undefined,
	allowedBlocks: boolean | string[] | undefined,
	prioritizedInserterBlocks: string[] | undefined,
	defaultBlock: DirectInsertBlock | undefined,
	directInsert: DirectInsert | undefined,
	__experimentalDefaultBlock: DirectInsertBlock | undefined,
	__experimentalDirectInsert: DirectInsert | undefined,
	templateLock: string | false | undefined,
	captureToolbars: boolean | undefined,
	orientation: 'horizontal' | 'vertical' | undefined,
	layout: Layout | null | undefined
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
		const newSettings: BlockListSettings = {
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
			// Layout types return `horizontal` or `vertical` for a valid layout.
			newSettings.orientation =
				// @ts-expect-error Bug: an unknown layout type has no `getOrientation`, so this throws.
				layoutType.getOrientation(
					// Without a layout, the default layout type ignores it.
					layout as Layout
				) as BlockListSettings[ 'orientation' ];
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
		// The map entry is created above.
		pendingSettingsUpdates.get( registry )![ clientId ] = newSettings;
		window.queueMicrotask( () => {
			// The map entry is created above.
			const settings = pendingSettingsUpdates.get( registry )!;
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
