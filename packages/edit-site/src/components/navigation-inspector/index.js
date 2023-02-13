/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationMenu from './navigation-menu';

export default function NavigationInspector( { onSelect } ) {
	const { navigationBlockId, isLoadingInnerBlocks, hasLoadedInnerBlocks } =
		useSelect( ( select ) => {
			const {
				__experimentalGetActiveBlockIdByBlockNames,
				__experimentalGetGlobalBlocksByName,
				getBlock,
			} = select( blockEditorStore );
			const { isResolving, hasFinishedResolution } = select( coreStore );

			const selectedNavBlockId =
				__experimentalGetActiveBlockIdByBlockNames(
					'core/navigation'
				) ||
				__experimentalGetGlobalBlocksByName( 'core/navigation' )?.[ 0 ];
			const selectedNavigationPost =
				selectedNavBlockId &&
				getBlock( selectedNavBlockId )?.attributes?.ref;

			return {
				navigationBlockId: selectedNavBlockId,
				isLoadingInnerBlocks: isResolving( 'getEntityRecord', [
					'postType',
					'wp_navigation',
					selectedNavigationPost,
				] ),
				hasLoadedInnerBlocks: hasFinishedResolution(
					'getEntityRecord',
					[ 'postType', 'wp_navigation', selectedNavigationPost ]
				),
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
				! navigationBlockId && (
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
			{ navigationBlockId && hasLoadedInnerBlocks && (
				<NavigationMenu
					onSelect={ onSelect }
					navigationBlockId={ navigationBlockId }
				/>
			) }
		</div>
	);
}
