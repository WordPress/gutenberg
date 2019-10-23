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
import { Fragment, useState } from '@wordpress/element';

export default { title: 'Modal', component: Modal };

export const _default = () => {
	const [ isOpen, setOpen ] = useState( true );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	const title = text( 'title', 'Title' );
	const icon = text( 'icon', '' );
	const isDismissible = boolean( 'isDismissible', true );
	const focusOnMount = boolean( 'focusOnMount', true );
	const shouldCloseOnEsc = boolean( 'shouldCloseOnEsc', true );
	const shouldCloseOnClickOutside = boolean(
		'shouldCloseOnClickOutside',
		true
	);

	const modalProps = {
		focusOnMount,
		isDismissible,
		shouldCloseOnEsc,
		shouldCloseOnClickOutside,
		title,
	};

	const iconComponent = icon ? <Dashicon icon={ icon } /> : null;

	return (
		<Fragment>
			<Button isDefault onClick={ openModal }>
				Open Modal
			</Button>
			{ isOpen && (
				<Modal
					{ ...modalProps }
					icon={ iconComponent }
					onRequestClose={ closeModal }
				>
					<Button isDefault onClick={ closeModal }>
						Close Modal
					</Button>
				</Modal>
			) }
		</Fragment>
	);
};
