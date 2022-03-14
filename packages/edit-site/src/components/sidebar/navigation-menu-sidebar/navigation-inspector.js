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

/**
 * Internal dependencies
 */
import NavigationMenu from './navigation-menu';

const NAVIGATION_MENUS_QUERY = [ { per_page: -1, status: 'publish' } ];

export default function NavigationInspector() {
	const {
		selectedNavigationBlockId,
		clientIdToRef,
		navigationMenus,
		hasResolvedNavigationMenus,
		firstNavigationBlockId,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetActiveBlockIdByBlockNames,
			__experimentalGetGlobalBlocksByName,
			getBlock,
		} = select( blockEditorStore );

		const { getNavigationMenus, hasFinishedResolution } = select(
			coreStore
		);

		// Get the active Navigation block (if present).
		const selectedNavId = __experimentalGetActiveBlockIdByBlockNames(
			'core/navigation'
		);

		// Get all Navigation blocks currently within the editor canvas.
		const navBlockIds = __experimentalGetGlobalBlocksByName(
			'core/navigation'
		);
		const idToRef = {};
		navBlockIds.forEach( ( id ) => {
			idToRef[ id ] = getBlock( id )?.attributes?.ref;
		} );
		return {
			selectedNavigationBlockId: selectedNavId,
			firstNavigationBlockId: navBlockIds?.[ 0 ],
			clientIdToRef: idToRef,
			navigationMenus: getNavigationMenus( NAVIGATION_MENUS_QUERY[ 0 ] ),
			hasResolvedNavigationMenus: hasFinishedResolution(
				'getNavigationMenus',
				NAVIGATION_MENUS_QUERY
			),
		};
	}, [] );

	const firstNavRefInTemplate = clientIdToRef[ firstNavigationBlockId ];
	const firstNavigationMenuRef = navigationMenus?.[ 0 ]?.id;

	// Default Navigation Menu `ref` is either:
	// - the Navigation Menu referenced by the first Nav block within the template.
	// - the first of the available Navigation Menus (`wp_navigation`) posts.
	const defaultNavigationMenu =
		firstNavRefInTemplate || firstNavigationMenuRef;

	const [ menu, setCurrentMenu ] = useState( firstNavRefInTemplate );

	// If a Nav block is selected within the canvas then set it to be
	// active within the Navigation sidebar.
	useEffect( () => {
		if ( selectedNavigationBlockId ) {
			setCurrentMenu( clientIdToRef[ selectedNavigationBlockId ] );
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
		{ id: menu || defaultNavigationMenu }
	);

	const { hasLoadedInnerBlocks } = useSelect(
		( select ) => {
			const { hasFinishedResolution } = select( coreStore );
			return {
				hasLoadedInnerBlocks: hasFinishedResolution(
					'getEntityRecord',
					[
						'postType',
						'wp_navigation',
						menu || defaultNavigationMenu,
					]
				),
			};
		},
		[ menu, defaultNavigationMenu ]
	);

	const isLoading = ! ( hasResolvedNavigationMenus && hasLoadedInnerBlocks );

	return (
		<div className="edit-site-navigation-inspector">
			{ ! hasResolvedNavigationMenus && (
				<div className="edit-site-navigation-inspector__placeholder" />
			) }
			{ hasResolvedNavigationMenus && (
				<SelectControl
					value={ menu || defaultNavigationMenu }
					options={ options }
					onChange={ ( val ) => setCurrentMenu( Number( val ) ) }
				/>
			) }
			{ isLoading && (
				<>
					<div className="edit-site-navigation-inspector__placeholder is-child" />
					<div className="edit-site-navigation-inspector__placeholder is-child" />
					<div className="edit-site-navigation-inspector__placeholder is-child" />
				</>
			) }
			{ ! isLoading && (
				<BlockEditorProvider
					value={ innerBlocks }
					onChange={ onChange }
					onInput={ onInput }
				>
					<NavigationMenu innerBlocks={ innerBlocks } />
				</BlockEditorProvider>
			) }
		</div>
	);
}
