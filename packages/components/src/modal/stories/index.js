/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Dashicon from '../../dashicon';
import Modal from '../';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export default { title: 'Components/Modal', component: Modal };

const ModalExample = ( props ) => {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	return (
		<>
			<Button variant="secondary" onClick={ openModal }>
				Open Modal
			</Button>
			{ isOpen && (
				<Modal { ...props } onRequestClose={ closeModal }>
					<Button variant="secondary" onClick={ closeModal }>
						Close Modal
					</Button>
				</Modal>
			) }
		</>
	);
};

export const _default = () => {
	const title = text( 'title', 'Title' );
	const icon = text( 'icon', '' );
	const isDismissible = boolean( 'isDismissible', true );
	const focusOnMount = boolean( 'focusOnMount', true );
	const shouldCloseOnEsc = boolean( 'shouldCloseOnEsc', true );
	const shouldCloseOnClickOutside = boolean(
		'shouldCloseOnClickOutside',
		true
	);

	const iconComponent = icon ? <Dashicon icon={ icon } /> : null;

	const modalProps = {
		icon: iconComponent,
		focusOnMount,
		isDismissible,
		shouldCloseOnEsc,
		shouldCloseOnClickOutside,
		title,
	};

	return <ModalExample { ...modalProps } />;
};
