/**
 * External dependencies
 */
import { flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ImportForm from '../import-form';

function ImportDropdown( { onUpload } ) {
	return (
		<Dropdown
			position="bottom right"
			contentClassName="list-reusable-blocks-import-dropdown__content"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					aria-expanded={ isOpen }
					onClick={ onToggle }
					variant="primary"
				>
					{ __( 'Import from JSON' ) }
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<ImportForm onUpload={ flow( onClose, onUpload ) } />
			) }
		/>
	);
}

export default ImportDropdown;
