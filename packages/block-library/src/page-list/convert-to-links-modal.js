/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
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
	setIsConverting,
} ) => () => {
	if ( ! pages ) {
		return;
	}

	const linkMap = {};
	const navigationLinks = [];
	setIsConverting( true );
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
	setIsConverting( false );
};

export default function ConvertToLinksModal( { onClose, clientId } ) {
	const [ isConverting, setIsConverting ] = useState( false );
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
					orderby: 'menu_order',
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
					isBusy={ isConverting }
					disabled={ ! pagesFinished || isConverting }
					onClick={ convertSelectedBlockToNavigationLinks( {
						pages,
						replaceBlock,
						clientId,
						createBlock: create,
						setIsConverting,
					} ) }
				>
					{ __( 'Convert' ) }
				</Button>
			</div>
		</Modal>
	);
}
