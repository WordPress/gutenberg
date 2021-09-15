/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AddMenu from '../add-menu';
import { useSelectedMenuId } from '../../hooks';

export default function NewButton( { menus } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ , setSelectedMenuId ] = useSelectedMenuId();

	return (
		<>
			<Button variant="tertiary" onClick={ () => setIsModalOpen( true ) }>
				{ __( 'New menu' ) }
			</Button>
			{ isModalOpen && (
				<Modal
					title={ __( 'Create a new menu' ) }
					onRequestClose={ () => setIsModalOpen( false ) }
				>
					<AddMenu
						menus={ menus }
						helpText={ __(
							'A short descriptive name for your menu.'
						) }
						onCreate={ ( menuId ) => {
							setIsModalOpen( false );
							setSelectedMenuId( menuId );
						} }
					/>
				</Modal>
			) }
		</>
	);
}
