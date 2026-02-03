/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function ZoomOutPageNavigation() {
	const history = useHistory();

	const { isZoomedOut, currentPostId, currentPostType, pages } = useSelect(
		( select ) => {
			const { isZoomOut } = unlock( select( blockEditorStore ) );
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const { getEntityRecords } = select( coreStore );

			return {
				isZoomedOut: isZoomOut(),
				currentPostId: getCurrentPostId(),
				currentPostType: getCurrentPostType(),
				pages: getEntityRecords( 'postType', 'page', {
					per_page: -1,
					status: 'publish',
					orderby: 'menu_order',
					order: 'asc',
				} ),
			};
		}
	);

	// Sort pages by menu_order, then by title (matching Page List block behavior)
	const sortedPages = useMemo( () => {
		if ( ! pages ) {
			return [];
		}
		return [ ...pages ].sort( ( a, b ) => {
			if ( a.menu_order === b.menu_order ) {
				return a.title.rendered.localeCompare( b.title.rendered );
			}
			return a.menu_order - b.menu_order;
		} );
	}, [ pages ] );

	// Only render for pages in zoom-out mode
	if ( ! isZoomedOut || currentPostType !== 'page' || ! sortedPages.length ) {
		return null;
	}

	// Find current page index and determine prev/next
	const currentIndex = sortedPages.findIndex(
		( p ) => p.id === currentPostId
	);
	const prevPage = currentIndex > 0 ? sortedPages[ currentIndex - 1 ] : null;
	const nextPage =
		currentIndex >= 0 && currentIndex < sortedPages.length - 1
			? sortedPages[ currentIndex + 1 ]
			: null;

	const navigateToPage = ( pageId ) => {
		history.navigate( `/page/${ pageId }?canvas=edit` );
	};

	return (
		<>
			{ prevPage && (
				<Button
					className="edit-site-zoom-out-page-navigation__prev"
					icon={ chevronLeft }
					label={ __( 'Previous page' ) }
					onClick={ () => navigateToPage( prevPage.id ) }
					__next40pxDefaultSize
				/>
			) }
			{ nextPage && (
				<Button
					className="edit-site-zoom-out-page-navigation__next"
					icon={ chevronRight }
					label={ __( 'Next page' ) }
					onClick={ () => navigateToPage( nextPage.id ) }
					__next40pxDefaultSize
				/>
			) }
		</>
	);
}
