/**
 * External dependencies
 */
import type { StoryFn, Meta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { fullscreen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../../button';
import InputControl from '../../input-control';
import Modal from '../';
import type { ModalProps } from '../types';

const meta: Meta< typeof Modal > = {
	component: Modal,
	title: 'Components/Overlays/Modal',
	id: 'components-modal',
	argTypes: {
		children: {
			control: false,
		},
		onKeyDown: {
			control: false,
		},
		focusOnMount: {
			options: [ true, false, 'firstElement', 'firstContentElement' ],
			control: { type: 'select' },
		},
		role: {
			control: { type: 'text' },
		},
		onRequestClose: {
			action: 'onRequestClose',
		},
		isDismissible: {
			control: { type: 'boolean' },
		},
	},
	parameters: {
		controls: { expanded: true },
	},
};
export default meta;

const Template: StoryFn< typeof Modal > = ( { onRequestClose, ...args } ) => {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal: ModalProps[ 'onRequestClose' ] = ( event ) => {
		setOpen( false );
		onRequestClose( event );
	};

	return (
		<>
			<Button variant="secondary" onClick={ openModal }>
				Open Modal
			</Button>
			{ isOpen && (
				<Modal onRequestClose={ closeModal } { ...args }>
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

					<InputControl
						__next40pxDefaultSize
						style={ { marginBottom: '20px' } }
					/>

					<Button variant="secondary" onClick={ closeModal }>
						Close Modal
					</Button>
				</Modal>
			) }
		</>
	);
};

export const Default: StoryFn< typeof Modal > = Template.bind( {} );
Default.args = {
	title: 'Title',
};
Default.parameters = {
	docs: {
		source: {
			code: '',
		},
	},
};

export const WithsizeSmall: StoryFn< typeof Modal > = Template.bind( {} );
WithsizeSmall.args = {
	size: 'small',
};
WithsizeSmall.storyName = 'With size: small';

/**
 * The `headerActions` prop can be used to add auxiliary actions to the header, for example a fullscreen mode toggle.
 */
export const WithHeaderActions: StoryFn< typeof Modal > = Template.bind( {} );
WithHeaderActions.args = {
	...Default.args,
	headerActions: (
		<Button icon={ fullscreen } label="Fullscreen mode" size="compact" />
	),
	children: <div style={ { height: '200px' } } />,
};
WithHeaderActions.parameters = {
	...Default.parameters,
};
