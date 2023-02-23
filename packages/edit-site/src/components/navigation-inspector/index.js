/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import {
	store as blockEditorStore,
	BlockEditorProvider,
	BlockTools,
	BlockList,
} from '@wordpress/block-editor';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationMenu from './navigation-menu';

const NAVIGATION_MENUS_QUERY = [
	'postType',
	'wp_navigation',
	[ { per_page: 1, status: 'publish' } ],
];

function NavigationBlockEditorLoader( { onSelect, navigationPostId } ) {
	const [ innerBlocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_navigation',
		{ id: navigationPostId }
	);
	return (
		<BlockEditorProvider
			value={ innerBlocks }
			onChange={ onChange }
			onInput={ onInput }
		>
			<NavigationMenu onSelect={ onSelect } />
			<div style={ { visibility: 'hidden' } }>
				<BlockTools>
					<BlockList />
				</BlockTools>
			</div>
		</BlockEditorProvider>
	);
}

export default function NavigationInspector( { onSelect } ) {
	const {
		navigationBlockId,
		navigationPostId,
		isLoadingInnerBlocks,
		hasLoadedInnerBlocks,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetActiveBlockIdByBlockNames,
			__experimentalGetGlobalBlocksByName,
			getBlock,
		} = select( blockEditorStore );
		const { isResolving, hasFinishedResolution, getEntityRecords } =
			select( coreStore );

		const selectedNavBlockId =
			__experimentalGetActiveBlockIdByBlockNames( 'core/navigation' ) ||
			__experimentalGetGlobalBlocksByName( 'core/navigation' )?.[ 0 ];

		let navigationPost, isLoading, hasLoaded;
		if ( selectedNavBlockId ) {
			navigationPost = getBlock( selectedNavBlockId )?.attributes?.ref;
			isLoading = isResolving( 'getEntityRecord', [
				'postType',
				'wp_navigation',
				navigationPost,
			] );
			hasLoaded = hasFinishedResolution( 'getEntityRecord', [
				'postType',
				'wp_navigation',
				navigationPost,
			] );
		} else {
			const navigationMenus = getEntityRecords(
				...NAVIGATION_MENUS_QUERY
			);
			if ( navigationMenus?.length > 0 ) {
				navigationPost = navigationMenus[ 0 ].id;
			}
			isLoading = isResolving(
				'getEntityRecords',
				NAVIGATION_MENUS_QUERY
			);
			hasLoaded = hasFinishedResolution(
				'getEntityRecords',
				NAVIGATION_MENUS_QUERY
			);
		}

		return {
			navigationPostId: navigationPost,
			navigationBlockId: selectedNavBlockId,
			isLoadingInnerBlocks: isLoading,
			hasLoadedInnerBlocks: hasLoaded,
		};
	}, [] );

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
			{ hasLoadedInnerBlocks &&
				! isLoadingInnerBlocks &&
				! navigationBlockId &&
				! navigationPostId && (
					<p className="edit-site-navigation-inspector__empty-msg">
						{ __( 'There are no Navigation Menus.' ) }
					</p>
				) }

			{ ! hasLoadedInnerBlocks && (
				<div className="edit-site-navigation-inspector__placeholder" />
			) }
			{ isLoadingInnerBlocks && (
				<>
					<div className="edit-site-navigation-inspector__placeholder is-child" />
					<div className="edit-site-navigation-inspector__placeholder is-child" />
					<div className="edit-site-navigation-inspector__placeholder is-child" />
				</>
			) }
			{ navigationBlockId && navigationPostId && hasLoadedInnerBlocks && (
				<NavigationMenu
					onSelect={ onSelect }
					navigationBlockId={ navigationBlockId }
				/>
			) }
			{ ! navigationBlockId &&
				navigationPostId &&
				hasLoadedInnerBlocks && (
					<NavigationBlockEditorLoader
						onSelect={ onSelect }
						navigationPostId={ navigationPostId }
					/>
				) }
		</div>
	);
}
