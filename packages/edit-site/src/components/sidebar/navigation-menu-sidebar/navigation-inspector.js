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
		selectedNavigationId,
		clientIdToRef,
		navigationMenus,
		hasResolvedNavigationMenus,
		firstNavigationId,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetActiveBlockIdByBlockNames,
			__experimentalGetGlobalBlocksByName,
			getBlock,
		} = select( blockEditorStore );

		const { getNavigationMenus, hasFinishedResolution } = select(
			coreStore
		);
		const selectedNavId = __experimentalGetActiveBlockIdByBlockNames(
			'core/navigation'
		);
		const navIds = __experimentalGetGlobalBlocksByName( 'core/navigation' );
		const idToRef = {};
		navIds.forEach( ( id ) => {
			idToRef[ id ] = getBlock( id )?.attributes?.ref;
		} );
		return {
			selectedNavigationId: selectedNavId,
			firstNavigationId: navIds?.[ 0 ],
			clientIdToRef: idToRef,
			navigationMenus: getNavigationMenus( NAVIGATION_MENUS_QUERY[ 0 ] ),
			hasResolvedNavigationMenus: hasFinishedResolution(
				'getNavigationMenus',
				NAVIGATION_MENUS_QUERY
			),
		};
	}, [] );

	const firstNavRefInTemplate = clientIdToRef[ firstNavigationId ];
	const firstNavRef = navigationMenus?.[ 0 ]?.id;
	const defaultValue = firstNavRefInTemplate || firstNavRef;

	const [ menu, setCurrentMenu ] = useState( firstNavRefInTemplate );

	useEffect( () => {
		if ( selectedNavigationId ) {
			setCurrentMenu( clientIdToRef[ selectedNavigationId ] );
		}
	}, [ selectedNavigationId ] );

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
		{ id: menu || defaultValue }
	);

	const { hasLoadedInnerBlocks } = useSelect(
		( select ) => {
			const { hasFinishedResolution } = select( coreStore );
			return {
				hasLoadedInnerBlocks: hasFinishedResolution(
					'getEntityRecord',
					[ 'postType', 'wp_navigation', menu || defaultValue ]
				),
			};
		},
		[ menu, defaultValue ]
	);

	const isLoading = ! ( hasResolvedNavigationMenus && hasLoadedInnerBlocks );

	return (
		<div className="edit-site-navigation-inspector">
			{ ! hasResolvedNavigationMenus && (
				<div className="edit-site-navigation-inspector__placeholder" />
			) }
			{ hasResolvedNavigationMenus && (
				<SelectControl
					value={ menu || defaultValue }
					options={ options }
					onChange={ setCurrentMenu }
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
