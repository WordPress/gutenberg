/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __experimentalHStack as HStack, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import DocumentActions from '../header-edit-mode/document-actions';

function HeaderViewMode() {
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );

	return (
		<HStack className="edit-site-header-view-mode" justify="flex-start">
			<Button
				className="edit-site-header-view-mode__edit-button"
				label={ __( 'Open the editor' ) }
				onClick={ () => {
					__unstableSetCanvasMode( 'edit' );
				} }
			>
				{ __( 'Edit' ) }
			</Button>
			<DocumentActions showDropdown={ false } />
			<div />
		</HStack>
	);
}

export default HeaderViewMode;
