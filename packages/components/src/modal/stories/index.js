/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Icon from '../../icon';
import Modal from '../';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { wordpress } from '@wordpress/icons';

export default {
	title: 'Components/Modal',
	component: Modal,
	parameters: {
		knobs: { disable: false },
	},
};

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
				<Modal
					{ ...props }
					onRequestClose={ closeModal }
					style={ { maxWidth: '600px' } }
				>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit,
						sed do eiusmod tempor incididunt ut labore et magna
						aliqua. Ut enim ad minim veniam, quis nostrud
						exercitation ullamco laboris nisi ut aliquip ex ea ea
						commodo consequat. Duis aute irure dolor in
						reprehenderit in voluptate velit esse cillum dolore eu
						fugiat nulla pariatur. Excepteur sint occaecat cupidatat
						non proident, sunt in culpa qui officia deserunt mollit
						anim id est laborum.
					</p>

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
	const showIcon = boolean( 'icon', false );
	const isDismissible = boolean( 'isDismissible', true );
	const focusOnMount = boolean( 'focusOnMount', true );
	const shouldCloseOnEsc = boolean( 'shouldCloseOnEsc', true );
	const shouldCloseOnClickOutside = boolean(
		'shouldCloseOnClickOutside',
		true
	);
	const __experimentalHideHeader = boolean(
		'__experimentalHideHeader',
		false
	);

	const iconComponent = showIcon ? <Icon icon={ wordpress } /> : null;

	const modalProps = {
		icon: iconComponent,
		focusOnMount,
		isDismissible,
		shouldCloseOnEsc,
		shouldCloseOnClickOutside,
		title,
		__experimentalHideHeader,
	};

	return <ModalExample { ...modalProps } />;
};
