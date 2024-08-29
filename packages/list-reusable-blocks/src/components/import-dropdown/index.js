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
					// TODO: Switch to `true` (40px size) if possible
					__next40pxDefaultSize={ false }
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
