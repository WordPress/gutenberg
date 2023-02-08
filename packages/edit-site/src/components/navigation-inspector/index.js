/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import {
	store as blockEditorStore,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { speak } from '@wordpress/a11y';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationMenu from './navigation-menu';

const NAVIGATION_MENUS_QUERY = [ { per_page: -1, status: 'publish' } ];

export default function NavigationInspector( { onSelect } ) {
	const {
		selectedNavigationBlockId,
		clientIdToRef,
		navigationMenus,
		isResolvingNavigationMenus,
		hasResolvedNavigationMenus,
		firstNavigationBlockId,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetActiveBlockIdByBlockNames,
			__experimentalGetGlobalBlocksByName,
			getBlock,
		} = select( blockEditorStore );

		const { getEntityRecords, hasFinishedResolution, isResolving } =
			select( coreStore );

		const navigationMenusQuery = [
			'postType',
			'wp_navigation',
			NAVIGATION_MENUS_QUERY[ 0 ],
		];

		// Get the active Navigation block (if present).
		const selectedNavId =
			__experimentalGetActiveBlockIdByBlockNames( 'core/navigation' );

		// Get all Navigation blocks currently within the editor canvas.
		const navBlockIds =
			__experimentalGetGlobalBlocksByName( 'core/navigation' );
		const idToRef = {};
		navBlockIds.forEach( ( id ) => {
			idToRef[ id ] = getBlock( id )?.attributes?.ref;
		} );
		return {
			selectedNavigationBlockId: selectedNavId,
			firstNavigationBlockId: navBlockIds?.[ 0 ],
			clientIdToRef: idToRef,
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

	const navMenuListId = useInstanceId(
		NavigationMenu,
		'edit-site-navigation-inspector-menu'
	);

	const firstNavRefInTemplate = clientIdToRef[ firstNavigationBlockId ];
	const firstNavigationMenuRef = navigationMenus?.[ 0 ]?.id;

	// Default Navigation Menu is either:
	// - the Navigation Menu referenced by the first Nav block within the template.
	// - the first of the available Navigation Menus (`wp_navigation`) posts.
	const defaultNavigationMenuId =
		firstNavRefInTemplate || firstNavigationMenuRef;

	// The Navigation Menu manually selected by the user within the Nav inspector.
	const [ currentMenuId, setCurrentMenuId ] = useState(
		firstNavRefInTemplate
	);

	// If a Nav block is selected within the canvas then set the
	// Navigation Menu referenced by it's `ref` attribute  to be
	// active within the Navigation sidebar.
	useEffect( () => {
		if ( selectedNavigationBlockId ) {
			setCurrentMenuId( clientIdToRef[ selectedNavigationBlockId ] );
		}
	}, [ selectedNavigationBlockId ] );

	let options = [];
	if ( navigationMenus ) {
		options = navigationMenus.map( ( { id, title } ) => ( {
			value: id,
			label: title.rendered,
		} ) );
	}

	const [ innerBlocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_navigation',
		{ id: currentMenuId || defaultNavigationMenuId }
	);

	const { isLoadingInnerBlocks, hasLoadedInnerBlocks } = useSelect(
		( select ) => {
			const { isResolving, hasFinishedResolution } = select( coreStore );
			return {
				isLoadingInnerBlocks: isResolving( 'getEntityRecord', [
					'postType',
					'wp_navigation',
					currentMenuId || defaultNavigationMenuId,
				] ),
				hasLoadedInnerBlocks: hasFinishedResolution(
					'getEntityRecord',
					[
						'postType',
						'wp_navigation',
						currentMenuId || defaultNavigationMenuId,
					]
				),
			};
		},
		[ currentMenuId, defaultNavigationMenuId ]
	);

	const isLoading = ! ( hasResolvedNavigationMenus && hasLoadedInnerBlocks );

	const hasMoreThanOneNavigationMenu = navigationMenus?.length > 1;

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
			{ hasResolvedNavigationMenus && hasMoreThanOneNavigationMenu && (
				<SelectControl
					__nextHasNoMarginBottom
					className="edit-site-navigation-inspector__select-menu"
					aria-controls={
						// aria-controls should only apply when referenced element is in DOM
						hasLoadedInnerBlocks ? navMenuListId : undefined
					}
					value={ currentMenuId || defaultNavigationMenuId }
					options={ options }
					onChange={ ( newMenuId ) =>
						setCurrentMenuId( Number( newMenuId ) )
					}
				/>
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
