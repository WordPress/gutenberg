/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInnerBlocksProps } from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { Disabled, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useContext, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';

const NOOP = () => {};
const DRAFT_MENU_PARAMS = [
	'postType',
	'wp_navigation',
	{ status: 'draft', per_page: -1 },
];

export default function UnsavedInnerBlocks( {
	blockProps,
	blocks,
	hasSavedUnsavedInnerBlocks,
	onSave,
	hasSelection,
} ) {
	const isDisabled = useContext( Disabled.Context );
	const savingLock = useRef( false );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: hasSelection ? undefined : false,

		// Make the inner blocks 'controlled'. This allows the block to always
		// work with controlled inner blocks, smoothing out the switch to using
		// an entity.
		value: blocks,
		onChange: NOOP,
		onInput: NOOP,
	} );
	const { saveEntityRecord } = useDispatch( coreStore );

	const {
		isSaving,
		draftNavigationMenus,
		hasResolvedDraftNavigationMenus,
	} = useSelect( ( select ) => {
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
	}, [] );

	const { hasResolvedNavigationMenus, navigationMenus } = useNavigationMenu();

	const createNavigationMenu = useCallback(
		async ( title ) => {
			const record = {
				title,
				content: serialize( blocks ),
				status: 'draft',
			};

			const navigationMenu = await saveEntityRecord(
				'postType',
				'wp_navigation',
				record
			);

			return navigationMenu;
		},
		[ blocks, serialize, saveEntityRecord ]
	);

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
			hasSavedUnsavedInnerBlocks ||
			isDisabled ||
			isSaving ||
			savingLock.current ||
			! hasResolvedDraftNavigationMenus ||
			! hasResolvedNavigationMenus ||
			! hasSelection
		) {
			return;
		}

		savingLock.current = true;
		const title = __( 'Untitled menu' );

		// Determine how many menus start with the untitled title.
		const matchingMenuTitleCount = [
			...draftNavigationMenus,
			...navigationMenus,
		].reduce(
			( count, menu ) =>
				menu?.title?.raw?.startsWith( title ) ? count + 1 : count,
			0
		);

		// Append a number to the end of the title if a menu with
		// the same name exists.
		const titleWithCount =
			matchingMenuTitleCount > 0
				? `${ title } ${ matchingMenuTitleCount + 1 }`
				: title;

		const menu = await createNavigationMenu( titleWithCount );
		onSave( menu );
		savingLock.current = false;
	}, [
		isDisabled,
		isSaving,
		hasResolvedDraftNavigationMenus,
		hasResolvedNavigationMenus,
		draftNavigationMenus,
		navigationMenus,
		hasSelection,
		createNavigationMenu,
	] );

	return (
		<>
			<nav { ...blockProps }>
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
			</nav>
		</>
	);
}
