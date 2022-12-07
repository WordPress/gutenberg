/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { createBlock as create } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

// copied from packages/block-library/src/page-list/convert-to-links-modal.js
const convertSelectedBlockToNavigationLinks =
	( { pages, clientId, replaceBlock, createBlock } ) =>
	() => {
		if ( ! pages?.length ) {
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

export const ConvertToLinksModal = ( { onClose, clientId, pages } ) => {
	const hasPages = !! pages?.length;

	const { replaceBlock } = useDispatch( blockEditorStore );

	return (
		<Modal
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
			title={ __( 'Customize this menu' ) }
			className={ 'wp-block-page-list-modal' }
			aria={ { describedby: 'wp-block-page-list-modal__description' } }
		>
			<p id={ 'wp-block-page-list-modal__description' }>
				{ __(
					'This menu is automatically kept in sync with pages on your site. You can manage the menu yourself by clicking customize below.'
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
					{ __( 'Customize' ) }
				</Button>
			</div>
		</Modal>
	);
};
