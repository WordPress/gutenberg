/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../../button';
import Modal from '../..';

export default {
	title: 'Components/Modal',
	component: Modal,
};

export const Default = () => {
	const [ isOpen, setIsOpen ] = useState( false );

	return (
		<>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				onClick={ () => setIsOpen( true ) }
			>
				Open Modal
			</Button>
			{ isOpen && (
				<Modal
					title="Modal title"
					onRequestClose={ () => setIsOpen( false ) }
				>
					Modal content
				</Modal>
			) }
		</>
	);
};
