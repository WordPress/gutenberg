/**
 * WordPress dependencies
 */
import { pipe } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ImportForm from '../import-form';

function ImportDropdown( { onUpload } ) {
	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-start' } }
			contentClassName="list-reusable-blocks-import-dropdown__content"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="compact"
					className="list-reusable-blocks-import-dropdown__button"
					aria-expanded={ isOpen }
					onClick={ onToggle }
					variant="primary"
				>
					{ __( 'Import from JSON' ) }
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<ImportForm onUpload={ pipe( onClose, onUpload ) } />
			) }
		/>
	);
}

export default ImportDropdown;
