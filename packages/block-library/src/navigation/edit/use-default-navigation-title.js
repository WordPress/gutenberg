/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useTemplatePartAreaLabel from '../use-template-part-area-label';

const EMPTY_OBJECT = {};
const DRAFT_MENU_PARAMS = [
	'postType',
	'wp_navigation',
	{ status: 'draft', per_page: -1 },
];

export default function useDefaultNavigationTitle( clientId ) {
	// The block will be disabled in a block preview, use this as a way of
	// avoiding the side-effects of this component for block previews.
	const isDisabled = useContext( Disabled.Context );

	const { draftNavigationMenus, hasResolvedDraftNavigationMenus } = useSelect(
		( select ) => {
			if ( isDisabled ) {
				return EMPTY_OBJECT;
			}

			const { getEntityRecords, hasFinishedResolution } = select(
				coreStore
			);

			return {
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

	// Because we can't conditionally call hooks, pass an undefined client id
	// arg to bypass the expensive `useTemplateArea` code. The hook will return
	// early.
	const area = useTemplatePartAreaLabel( isDisabled ? undefined : clientId );

	return useMemo( () => {
		// Ensure other navigation menus have loaded so an
		// accurate name can be created.
		if (
			isDisabled ||
			! hasResolvedDraftNavigationMenus ||
			! hasResolvedNavigationMenus
		) {
			return '';
		}

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

		return titleWithCount || '';
	}, [
		isDisabled,
		hasResolvedDraftNavigationMenus,
		hasResolvedNavigationMenus,
		draftNavigationMenus,
		navigationMenus,
		area,
	] );
}
