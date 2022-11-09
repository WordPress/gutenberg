/**
 * WordPress dependencies
 */
import { edit } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { Button, Modal } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { createBlock as create } from '@wordpress/blocks';
import {
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
// import InspectorControls from '../../components/inspector-controls';

// copied from packages/block-library/src/page-list/edit.js

// We only show the edit option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;

const usePageData = () => {
	const { records: pages, hasResolved: hasResolvedPages } = useEntityRecords(
		'postType',
		'page',
		{
			orderby: 'menu_order',
			order: 'asc',
			_fields: [ 'id', 'link', 'parent', 'title', 'menu_order' ],
			per_page: -1,
			context: 'view',
		}
	);

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
			pagesByParentId,
			hasResolvedPages,
			totalPages: pages?.length ?? null,
		};
	}, [ pages, hasResolvedPages ] );
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

const ConvertToLinksModal = ( { onClose, clientId } ) => {
	const { records: pages, hasResolved: pagesFinished } = useEntityRecords(
		'postType',
		'page',
		{
			per_page: MAX_PAGE_COUNT,
			_fields: PAGE_FIELDS,
			// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
			// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
			// sort.
			orderby: 'menu_order',
			order: 'asc',
		}
	);

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
					disabled={ ! pagesFinished }
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

// const BlockEditPanel = () => {
// 	return <div>Block Edit Panel</div>;
// };

const BlockEditButton = ( { label, clientId } ) => {
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );
	const [ convertModalOpen, setConvertModalOpen ] = useState( false );
	// const [ inspectorPanelOpen, setInspectorPanelOpen ] = useState( false );
	const { totalPages } = usePageData();
	const allowConvertToLinks = totalPages <= MAX_PAGE_COUNT;

	const block = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId );
		},
		[ clientId ]
	);

	const { enableComplementaryArea } = useDispatch( interfaceStore, [] );

	const onClick = () => {
		toggleBlockHighlight( clientId, true );
		if ( 'core/page-list' === block.name ) {
			setConvertModalOpen( ! convertModalOpen );
		} else {
			enableComplementaryArea( 'core/off-canvas-editor-item' );
		}
	};

	return (
		<>
			{ convertModalOpen && (
				<ConvertToLinksModal
					onClose={ () => setConvertModalOpen( false ) }
					clientId={ clientId }
				/>
			) }
			<ComplementaryArea
				scope="core/off-canvas-editor-item"
				title={ `Edit ${ block.name }` }
			>
				Hello, I am a panel.
			</ComplementaryArea>
			{ allowConvertToLinks && (
				<Button icon={ edit } label={ label } onClick={ onClick } />
			) }
		</>
	);
};

export default BlockEditButton;
