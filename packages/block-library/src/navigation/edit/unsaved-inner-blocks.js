/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInnerBlocksProps } from '@wordpress/block-editor';
import { Disabled, Spinner } from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useCreateNavigationMenu from './use-create-navigation-menu';

const EMPTY_OBJECT = {};
const DRAFT_MENU_PARAMS = [
	'postType',
	'wp_navigation',
	{ status: 'draft', per_page: -1 },
];

export default function UnsavedInnerBlocks( {
	blockProps,
	blocks,
	clientId,
	hasSavedUnsavedInnerBlocks,
	onSave,
	hasSelection,
} ) {
	// The block will be disabled in a block preview, use this as a way of
	// avoiding the side-effects of this component for block previews.
	const isDisabled = useContext( Disabled.Context );
	const savingLock = useRef( false );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: hasSelection ? undefined : false,
	} );

	const {
		isSaving,
		draftNavigationMenus,
		hasResolvedDraftNavigationMenus,
	} = useSelect(
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
				isSaving: isSavingEntityRecord( 'postType', 'wp_navigation' ),
				draftNavigationMenus: getEntityRecords( ...DRAFT_MENU_PARAMS ),
				hasResolvedDraftNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					DRAFT_MENU_PARAMS
				),
			};
		},
		[ isDisabled ]
	);

	const navigationMenus = useEntityRecords( 'postType', 'wp_navigation', {
		per_page: -1,
		status: 'publish',
	} );

	const createNavigationMenu = useCreateNavigationMenu( clientId );

	// Automatically save the uncontrolled blocks.
	useEffect( async () => {
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
			hasSavedUnsavedInnerBlocks ||
			isSaving ||
			savingLock.current ||
			! hasResolvedDraftNavigationMenus ||
			! navigationMenus.hasResolved ||
			! hasSelection
		) {
			return;
		}

		savingLock.current = true;
		const menu = await createNavigationMenu( null, blocks );
		onSave( menu );
		savingLock.current = false;
	}, [
		isDisabled,
		isSaving,
		hasResolvedDraftNavigationMenus,
		navigationMenus.hasResolved,
		draftNavigationMenus,
		navigationMenus.records,
		hasSelection,
		createNavigationMenu,
		blocks,
	] );

	return (
		<div className="wp-block-navigation__unsaved-changes">
			<Disabled
				className={ classnames(
					'wp-block-navigation__unsaved-changes-overlay',
					{
						'is-saving': hasSelection,
					}
				) }
			>
				<div { ...innerBlocksProps } />
			</Disabled>
			{ hasSelection && <Spinner /> }
		</div>
	);
}
