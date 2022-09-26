/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';
import { useContext, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useTemplatePartAreaLabel from '../use-template-part-area-label';

const DRAFT_MENU_PARAMS = [
	'postType',
	'wp_navigation',
	{ status: 'draft', per_page: -1 },
];

const PUBLISHED_MENU_PARAMS = [
	'postType',
	'wp_navigation',
	{ per_page: -1, status: 'publish' },
];

export default function useGenerateDefaultNavigationTitle( clientId ) {
	// The block will be disabled in a block preview, use this as a way of
	// avoiding the side-effects of this component for block previews.
	const isDisabled = useContext( Disabled.Context );

	// Because we can't conditionally call hooks, pass an undefined client id
	// arg to bypass the expensive `useTemplateArea` code. The hook will return
	// early.
	const area = useTemplatePartAreaLabel( isDisabled ? undefined : clientId );

	const registry = useRegistry();
	return useCallback( async () => {
		// Ensure other navigation menus have loaded so an
		// accurate name can be created.
		if ( isDisabled ) {
			return '';
		}
		const { getEntityRecords } = registry.resolveSelect( coreStore );

		const [ draftNavigationMenus, navigationMenus ] = await Promise.all( [
			getEntityRecords( ...DRAFT_MENU_PARAMS ),
			getEntityRecords( ...PUBLISHED_MENU_PARAMS ),
		] );

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
	}, [ isDisabled, area ] );
}
