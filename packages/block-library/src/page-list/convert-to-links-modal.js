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
const FETCH_ALL_PAGES = -1;

export const convertSelectedBlockToNavigationLinks = ( {
	pages,
	clientId,
	replaceBlock,
	createBlock,
} ) => () => {
	//TODO: handle resolving state
	//TODO: test performance for lots of pages
	//TODO: add related aria-labels
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
				label: title.rendered, //TODO: raw or rendered?
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
	const pages = useSelect(
		( select ) => {
			const { getPages } = select( coreDataStore );
			return getPages( {
				per_page: FETCH_ALL_PAGES,
				_fields: PAGE_FIELDS,
				orderby: 'menu_order',
			} );
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
		>
			<p>
				{ __(
					'To edit this navigation menu, convert it to single page links. This allows you to add re-order, remove items, or edit their labels.'
				) }
			</p>
			<p>
				{ __(
					"Note: if you add new pages to your site, you'll need to add them to your navigation menu."
				) }
			</p>
			<div className="wp-block-page-list-modal-buttons">
				<Button isTertiary onClick={ onClose }>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					isPrimary
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
