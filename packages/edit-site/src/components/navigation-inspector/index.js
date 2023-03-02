/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationMenu from './navigation-menu';

const NAVIGATION_MENUS_QUERY = [ { per_page: -1, status: 'publish' } ];

export default function NavigationInspector( { onSelect } ) {
	const {
		navigationMenus,
		isResolvingNavigationMenus,
		hasResolvedNavigationMenus,
	} = useSelect( ( select ) => {
		const { getEntityRecords, hasFinishedResolution, isResolving } =
			select( coreStore );

		const navigationMenusQuery = [
			'postType',
			'wp_navigation',
			NAVIGATION_MENUS_QUERY[ 0 ],
		];
		return {
			navigationMenus: getEntityRecords( ...navigationMenusQuery ),
			isResolvingNavigationMenus: isResolving(
				'getEntityRecords',
				navigationMenusQuery
			),
			hasResolvedNavigationMenus: hasFinishedResolution(
				'getEntityRecords',
				navigationMenusQuery
			),
		};
	}, [] );

	// This is copied from the edit component of the Navigation block.
	const fallbackNavigationMenus = useMemo(
		() =>
			navigationMenus
				?.filter( ( menu ) => menu.status === 'publish' )
				?.sort( ( menuA, menuB ) => {
					const menuADate = new Date( menuA.date );
					const menuBDate = new Date( menuB.date );
					return menuADate.getTime() > menuBDate.getTime(); // This condition is the other way in the navigation block... hmmmm...
				} ),
		[ navigationMenus ]
	);
	const fallbackNavigationId = fallbackNavigationMenus?.[ 0 ]?.id;

	// Do we need to fetch the fallback menu again, or can we do this in the useSelect above?
	const [ innerBlocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_navigation',
		{ id: fallbackNavigationId }
	);

	const { isLoadingInnerBlocks, hasLoadedInnerBlocks } = useSelect(
		( select ) => {
			const { isResolving, hasFinishedResolution } = select( coreStore );
			return {
				isLoadingInnerBlocks: isResolving( 'getEntityRecord', [
					'postType',
					'wp_navigation',
					fallbackNavigationId,
				] ),
				hasLoadedInnerBlocks: hasFinishedResolution(
					'getEntityRecord',
					[ 'postType', 'wp_navigation', fallbackNavigationId ]
				),
			};
		},
		[ fallbackNavigationId ]
	);

	const isLoading = ! ( hasResolvedNavigationMenus && hasLoadedInnerBlocks );

	const hasNavigationMenus = !! navigationMenus?.length;

	// Entity block editor will return entities that are not currently published.
	// Guard by only allowing their usage if there are published Nav Menus.
	const publishedInnerBlocks = hasNavigationMenus ? innerBlocks : [];

	const hasInnerBlocks = !! publishedInnerBlocks?.length;

	useEffect( () => {
		if ( isResolvingNavigationMenus ) {
			speak( 'Loading Navigation sidebar menus.' );
		}

		if ( hasResolvedNavigationMenus ) {
			speak( 'Navigation sidebar menus have loaded.' );
		}
	}, [ isResolvingNavigationMenus, hasResolvedNavigationMenus ] );

	useEffect( () => {
		if ( isLoadingInnerBlocks ) {
			speak( 'Loading Navigation sidebar selected menu items.' );
		}

		if ( hasLoadedInnerBlocks ) {
			speak( 'Navigation sidebar selected menu items have loaded.' );
		}
	}, [ isLoadingInnerBlocks, hasLoadedInnerBlocks ] );

	return (
		<div className="edit-site-navigation-inspector">
			{ hasResolvedNavigationMenus && ! hasNavigationMenus && (
				<p className="edit-site-navigation-inspector__empty-msg">
					{ __( 'There are no Navigation Menus.' ) }
				</p>
			) }

			{ ! hasResolvedNavigationMenus && (
				<div className="edit-site-navigation-inspector__placeholder" />
			) }
			{ isLoading && (
				<>
					<div className="edit-site-navigation-inspector__placeholder is-child" />
					<div className="edit-site-navigation-inspector__placeholder is-child" />
					<div className="edit-site-navigation-inspector__placeholder is-child" />
				</>
			) }
			{ hasInnerBlocks && ! isLoading && (
				<BlockEditorProvider
					value={ publishedInnerBlocks }
					onChange={ onChange }
					onInput={ onInput }
				>
					<NavigationMenu
						innerBlocks={ publishedInnerBlocks }
						onSelect={ onSelect }
					/>
				</BlockEditorProvider>
			) }

			{ ! hasInnerBlocks && ! isLoading && (
				<p className="edit-site-navigation-inspector__empty-msg">
					{ __( 'Navigation Menu is empty.' ) }
				</p>
			) }
		</div>
	);
}
