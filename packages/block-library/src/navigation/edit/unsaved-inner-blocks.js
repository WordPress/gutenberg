/**
 * WordPress dependencies
 */
import { useInnerBlocksProps } from '@wordpress/block-editor';
import { Disabled } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useEffect, useRef, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';

const EMPTY_OBJECT = {};
const DRAFT_MENU_PARAMS = [
	'postType',
	'wp_navigation',
	{ status: 'draft', per_page: -1 },
];

const DEFAULT_BLOCK = {
	name: 'core/navigation-link',
};

const ALLOWED_BLOCKS = [
	'core/navigation-link',
	'core/search',
	'core/social-links',
	'core/page-list',
	'core/spacer',
	'core/home-link',
	'core/site-title',
	'core/site-logo',
	'core/navigation-submenu',
];

/**
 * Conditionally compares two candidates for deep equality.
 * Provides an option to skip a given property of an object during comparison.
 *
 * @param {*}                  x          1st candidate for comparison
 * @param {*}                  y          2nd candidate for comparison
 * @param {Function|undefined} shouldSkip a function which can be used to skip a given property of an object.
 * @return {boolean}                      whether the two candidates are deeply equal.
 */
const isDeepEqual = ( x, y, shouldSkip ) => {
	if ( x === y ) {
		return true;
	} else if (
		typeof x === 'object' &&
		x !== null &&
		x !== undefined &&
		typeof y === 'object' &&
		y !== null &&
		y !== undefined
	) {
		if ( Object.keys( x ).length !== Object.keys( y ).length ) return false;

		for ( const prop in x ) {
			if ( y.hasOwnProperty( prop ) ) {
				// Afford skipping a given property of an object.
				if ( shouldSkip && shouldSkip( prop, x ) ) {
					return true;
				}

				if ( ! isDeepEqual( x[ prop ], y[ prop ], shouldSkip ) )
					return false;
			} else return false;
		}

		return true;
	}

	return false;
};

export default function UnsavedInnerBlocks( {
	blocks,
	createNavigationMenu,

	hasSelection,
} ) {
	const originalBlocks = useRef();

	useEffect( () => {
		// Initially store the uncontrolled inner blocks for
		// dirty state comparison.
		if ( ! originalBlocks?.current ) {
			originalBlocks.current = blocks;
		}
	}, [ blocks ] );

	// If the current inner blocks are different from the original inner blocks
	// from the post content then the user has made changes to the inner blocks.
	// At this point the inner blocks can be considered "dirty".
	// Note: referential equality is not sufficient for comparison as the inner blocks
	// of the page list are controlled and may be updated async due to syncing with
	// entity records. As a result we need to perform a deep equality check skipping
	// the page list's inner blocks.
	const innerBlocksAreDirty = ! isDeepEqual(
		originalBlocks.current,
		blocks,
		( prop, x ) => {
			// Skip inner blocks of page list during comparison as they
			// are **always** controlled and may be updated async due to
			// syncing with enitiy records. Left unchecked this would
			// inadvertently trigger the dirty state.
			if ( x?.name === 'core/page-list' && prop === 'innerBlocks' ) {
				return true;
			}
		}
	);

	const shouldDirectInsert = useMemo(
		() =>
			blocks.every(
				( { name } ) =>
					name === 'core/navigation-link' ||
					name === 'core/navigation-submenu' ||
					name === 'core/page-list'
			),
		[ blocks ]
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
			allowedBlocks: ALLOWED_BLOCKS,
			__experimentalDefaultBlock: DEFAULT_BLOCK,
			__experimentalDirectInsert: shouldDirectInsert,
		}
	);

	const { isSaving, draftNavigationMenus, hasResolvedDraftNavigationMenus } =
		useSelect(
			( select ) => {
				if ( isDisabled ) {
					return EMPTY_OBJECT;
				}

				const {
					getEntityRecords,
					hasFinishedResolution,
					isSavingEntityRecord,
				} = select( coreStore );

				return {
					isSaving: isSavingEntityRecord(
						'postType',
						'wp_navigation'
					),
					draftNavigationMenus: getEntityRecords(
						...DRAFT_MENU_PARAMS
					),
					hasResolvedDraftNavigationMenus: hasFinishedResolution(
						'getEntityRecords',
						DRAFT_MENU_PARAMS
					),
				};
			},
			[ isDisabled ]
		);

	const { hasResolvedNavigationMenus, navigationMenus } = useNavigationMenu();

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
			! hasResolvedDraftNavigationMenus ||
			! hasResolvedNavigationMenus ||
			! hasSelection ||
			! innerBlocksAreDirty
		) {
			return;
		}

		createNavigationMenu( null, blocks );
	}, [
		isDisabled,
		isSaving,
		hasResolvedDraftNavigationMenus,
		hasResolvedNavigationMenus,
		draftNavigationMenus,
		navigationMenus,
		hasSelection,
		createNavigationMenu,
		blocks,
	] );

	const Wrapper = isSaving ? Disabled : 'div';

	return <Wrapper { ...innerBlocksProps } />;
}
