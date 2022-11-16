/**
 * WordPress dependencies
 */
import { edit } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useRef, useMemo, useState, useEffect } from '@wordpress/element';
import { Button, Modal } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock as create } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
/**
 * External dependencies
 */
// import InspectorControls from '../../components/inspector-controls';

// copied from packages/block-library/src/page-list/edit.js

// We only show the edit option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;

const usePageData = () => {
	const isMounted = useRef();
	const [ pages, setPages ] = useState();

	useEffect( () => {
		isMounted.current = true;

		return () => ( isMounted.current = false );
	}, [] );

	// 1. Grab editor settings
	// 2. Call the selector when we need it
	const { fetchPages } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );

		return {
			fetchPages: getSettings().__experimentalFetchPageEntities,
		};
	}, [] ); // empty array is required to avoid invalidating fetchPages

	useEffect( () => {
		( async () => {
			// If `__experimentalFetchPageEntities` is not defined in block editor settings,
			// do not attempt to fetch Pages.
			if ( ! fetchPages || ! isMounted.current ) {
				return;
			}

			debugger;

			const pagesResult = await fetchPages();
			setPages( pagesResult );
			// Todo: handle errors with catch
		} )();
	}, [ fetchPages ] );

	return useMemo( () => {
		// TODO: Once the REST API supports passing multiple values to
		// 'orderby', this can be removed.
		// https://core.trac.wordpress.org/ticket/39037
		const sortedPages = [ ...( pages ?? [] ) ].sort( ( a, b ) => {
			if ( a.menu_order === b.menu_order ) {
				return a.title.rendered.localeCompare( b.title.rendered );
			}
			return a.menu_order - b.menu_order;
		} );
		const pagesByParentId = sortedPages.reduce( ( accumulator, page ) => {
			const { parent } = page;
			if ( accumulator.has( parent ) ) {
				accumulator.get( parent ).push( page );
			} else {
				accumulator.set( parent, [ page ] );
			}
			return accumulator;
		}, new Map() );

		return {
			pages, // necessary for access outside the hook
			pagesByParentId,
			totalPages: pages?.length ?? null,
		};
	}, [ pages ] );
};

// copied from convert-to-links-modal.js
/**
 * WordPress dependencies
 */
const PAGE_FIELDS = [ 'id', 'title', 'link', 'type', 'parent' ];

const convertSelectedBlockToNavigationLinks =
	( { pages, clientId, replaceBlock, createBlock } ) =>
	() => {
		if ( ! pages ) {
			return;
		}

		const linkMap = {};
		const navigationLinks = [];
		pages.forEach( ( { id, title, link: url, type, parent } ) => {
			// See if a placeholder exists. This is created if children appear before parents in list.
			const innerBlocks = linkMap[ id ]?.innerBlocks ?? [];
			linkMap[ id ] = createBlock(
				'core/navigation-link',
				{
					id,
					label: title.rendered,
					url,
					type,
					kind: 'post-type',
				},
				innerBlocks
			);

			if ( ! parent ) {
				navigationLinks.push( linkMap[ id ] );
			} else {
				if ( ! linkMap[ parent ] ) {
					// Use a placeholder if the child appears before parent in list.
					linkMap[ parent ] = { innerBlocks: [] };
				}
				const parentLinkInnerBlocks = linkMap[ parent ].innerBlocks;
				parentLinkInnerBlocks.push( linkMap[ id ] );
			}
		} );

		// Transform all links with innerBlocks into Submenus. This can't be done
		// sooner because page objects have no information on their children.

		const transformSubmenus = ( listOfLinks ) => {
			listOfLinks.forEach( ( block, index, listOfLinksArray ) => {
				const { attributes, innerBlocks } = block;
				if ( innerBlocks.length !== 0 ) {
					transformSubmenus( innerBlocks );
					const transformedBlock = createBlock(
						'core/navigation-submenu',
						attributes,
						innerBlocks
					);
					listOfLinksArray[ index ] = transformedBlock;
				}
			} );
		};

		transformSubmenus( navigationLinks );

		replaceBlock( clientId, navigationLinks );
	};

const ConvertToLinksModal = ( { onClose, clientId, pages } ) => {
	const hasPages = !! pages?.length;

	const { replaceBlock } = useDispatch( blockEditorStore );

	return (
		<Modal
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
			title={ __( 'Convert to links' ) }
			className={ 'wp-block-page-list-modal' }
			aria={ { describedby: 'wp-block-page-list-modal__description' } }
		>
			<p id={ 'wp-block-page-list-modal__description' }>
				{ __(
					'To edit this navigation menu, convert it to single page links. This allows you to add, re-order, remove items, or edit their labels.'
				) }
			</p>
			<p>
				{ __(
					"Note: if you add new pages to your site, you'll need to add them to your navigation menu."
				) }
			</p>
			<div className="wp-block-page-list-modal-buttons">
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					variant="primary"
					disabled={ ! hasPages }
					onClick={ convertSelectedBlockToNavigationLinks( {
						pages,
						replaceBlock,
						clientId,
						createBlock: create,
					} ) }
				>
					{ __( 'Convert' ) }
				</Button>
			</div>
		</Modal>
	);
};

const BlockEditButton = ( { label, clientId } ) => {
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );
	const [ convertModalOpen, setConvertModalOpen ] = useState( false );
	const { pages, totalPages } = usePageData();

	const block = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId );
		},
		[ clientId ]
	);

	const onClick = () => {
		toggleBlockHighlight( clientId, true );
		setConvertModalOpen( ! convertModalOpen );
	};

	const allowConvertToLinks =
		'core/page-list' === block.name && totalPages <= MAX_PAGE_COUNT;

	return (
		<>
			{ convertModalOpen && (
				<ConvertToLinksModal
					onClose={ () => setConvertModalOpen( false ) }
					clientId={ clientId }
					pages={ pages }
				/>
			) }
			{ allowConvertToLinks && (
				<Button icon={ edit } label={ label } onClick={ onClick } />
			) }
		</>
	);
};

export default BlockEditButton;
