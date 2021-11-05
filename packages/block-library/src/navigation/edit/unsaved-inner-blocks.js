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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useTemplatePartAreaLabel from '../use-template-part-area-label';

const NOOP = () => {};
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

	// Because we can't conditionally call hooks, pass an undefined client id
	// arg to bypass the expensive `useTemplateArea` code. The hook will return
	// early.
	const area = useTemplatePartAreaLabel( isDisabled ? undefined : clientId );

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
			! hasResolvedNavigationMenus ||
			! hasSelection
		) {
			return;
		}

		savingLock.current = true;
		const title = area
			? sprintf(
					// translators: %s: the name of a menu (e.g. Header navigation).
					__( '%s navigation' ),
					area
			  )
			: // translators: 'navigation' as in website navigation.
			  __( 'Navigation' );

		// Determine how many menus start with the automatic title.
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
		area,
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
