/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { createBlock as create } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

const PAGE_FIELDS = [ 'id', 'title', 'link', 'type', 'parent' ];
const MAX_PAGE_COUNT = 100;

export const convertSelectedBlockToNavigationLinks = ( {
	pages,
	clientId,
	replaceBlock,
	createBlock,
} ) => () => {
	if ( ! pages ) {
		return;
	}

	const linkMap = {};
	const navigationLinks = [];
	pages.forEach( ( { id, title, link: url, type, parent } ) => {
		// See if a placeholder exists. This is created if children appear before parents in list
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
				// Use a placeholder if the child appears before parent in list
				linkMap[ parent ] = { innerBlocks: [] };
			}
			const parentLinkInnerBlocks = linkMap[ parent ].innerBlocks;
			parentLinkInnerBlocks.push( linkMap[ id ] );
		}
	} );

	replaceBlock( clientId, navigationLinks );
};

export default function ConvertToLinksModal( { onClose, clientId } ) {
	const { pages, pagesFinished } = useSelect(
		( select ) => {
			const { getEntityRecords, hasFinishedResolution } = select(
				coreDataStore
			);
			const query = [
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
				},
			];
			return {
				pages: getEntityRecords( ...query ),
				pagesFinished: hasFinishedResolution(
					'getEntityRecords',
					query
				),
			};
		},
		[ clientId ]
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
}
