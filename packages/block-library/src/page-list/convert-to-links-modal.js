/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import { convertToNavigationLinks } from './convert-to-navigation-links';

/**
 * Internal dependencies
 */
import { convertDescription } from './constants';

const PAGE_FIELDS = [ 'id', 'title', 'link', 'type', 'parent' ];
const MAX_PAGE_COUNT = 100;

export default function ConvertToLinksModal( { onClose, clientId } ) {
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
			title={ __( 'Customize this menu' ) }
			className={ 'wp-block-page-list-modal' }
			aria={ { describedby: 'wp-block-page-list-modal__description' } }
		>
			<p id={ 'wp-block-page-list-modal__description' }>
				{ convertDescription }
			</p>
			<div className="wp-block-page-list-modal-buttons">
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					variant="primary"
					disabled={ ! pagesFinished }
					onClick={ () => {
						const navigationLinks =
							convertToNavigationLinks( pages );

						// Replace the Page List block with the Navigation Links.
						replaceBlock( clientId, navigationLinks );
					} }
				>
					{ __( 'Customize' ) }
				</Button>
			</div>
		</Modal>
	);
}
