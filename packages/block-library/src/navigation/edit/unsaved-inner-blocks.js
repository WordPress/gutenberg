/**
 * WordPress dependencies
 */
import { useInnerBlocksProps } from '@wordpress/block-editor';
import { Disabled } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { areBlocksDirty } from './are-blocks-dirty';
import { DEFAULT_BLOCK, SELECT_NAVIGATION_MENUS_ARGS } from '../constants';

const EMPTY_OBJECT = {};

export default function UnsavedInnerBlocks( {
	blocks,
	createNavigationMenu,
	hasSelection,
} ) {
	const originalBlocksRef = useRef();

	useEffect( () => {
		// Initially store the uncontrolled inner blocks for
		// dirty state comparison.
		if ( ! originalBlocksRef?.current ) {
			originalBlocksRef.current = blocks;
		}
	}, [ blocks ] );

	// If the current inner blocks are different from the original inner blocks
	// from the post content then the user has made changes to the inner blocks.
	// At this point the inner blocks can be considered "dirty".
	// Note: referential equality is not sufficient for comparison as the inner blocks
	// of the page list are controlled and may be updated async due to syncing with
	// entity records. As a result we need to perform a deep equality check skipping
	// the page list's inner blocks.
	const innerBlocksAreDirty = areBlocksDirty(
		originalBlocksRef?.current,
		blocks
	);

	// The block will be disabled in a block preview, use this as a way of
	// avoiding the side-effects of this component for block previews.
	const isDisabled = useContext( Disabled.Context );

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			renderAppender: hasSelection ? undefined : false,
			defaultBlock: DEFAULT_BLOCK,
			directInsert: true,
		}
	);

	const { isSaving, hasResolvedAllNavigationMenus } = useSelect(
		( select ) => {
			if ( isDisabled ) {
				return EMPTY_OBJECT;
			}

			const { hasFinishedResolution, isSavingEntityRecord } =
				select( coreStore );

			return {
				isSaving: isSavingEntityRecord( 'postType', 'wp_navigation' ),
				hasResolvedAllNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					SELECT_NAVIGATION_MENUS_ARGS
				),
			};
		},
		[ isDisabled ]
	);

	// Automatically save the uncontrolled blocks.
	useEffect( () => {
		// The block will be disabled when used in a BlockPreview.
		// In this case avoid automatic creation of a wp_navigation post.
		// Otherwise the user will be spammed with lots of menus!
		//
		// Also ensure other navigation menus have loaded so an
		// accurate name can be created.
		//
		// Don't try saving when another save is already
		// in progress.
		//
		// And finally only create the menu when the block is selected,
		// which is an indication they want to start editing.
		if (
			isDisabled ||
			isSaving ||
			! hasResolvedAllNavigationMenus ||
			! hasSelection ||
			! innerBlocksAreDirty
		) {
			return;
		}

		createNavigationMenu( null, blocks );
	}, [
		blocks,
		createNavigationMenu,
		isDisabled,
		isSaving,
		hasResolvedAllNavigationMenus,
		innerBlocksAreDirty,
		hasSelection,
	] );

	const Wrapper = isSaving ? Disabled : 'div';

	return <Wrapper { ...innerBlocksProps } />;
}
