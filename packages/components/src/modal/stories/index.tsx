/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { help, starEmpty, starFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Tooltip from '../../tooltip';
import InputControl from '../../input-control';
import Modal from '../';
import type { ModalProps } from '../types';

const meta: ComponentMeta< typeof Modal > = {
	component: Modal,
	title: 'Components/Modal',
	argTypes: {
		children: {
			control: { type: null },
		},
		onKeyDown: {
			control: { type: null },
		},
		focusOnMount: {
			control: { type: 'boolean' },
		},
		role: {
			control: { type: 'text' },
		},
		onRequestClose: {
			action: 'onRequestClose',
		},
	},
	parameters: {
		controls: { expanded: true },
	},
};
export default meta;

const Template: ComponentStory< typeof Modal > = ( {
	onRequestClose,
	...args
} ) => {
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
				<Modal
					onRequestClose={ closeModal }
					style={ { maxWidth: '600px' } }
					{ ...args }
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

					<InputControl style={ { marginBottom: '20px' } } />

					<Button variant="secondary" onClick={ closeModal }>
						Close Modal
					</Button>
				</Modal>
			) }
		</>
	);
};

const TemplateWithHeaderActions: ComponentStory< typeof Modal > = ( {
	onRequestClose,
	...args
} ) => {
	const [ isLiked, setIsLiked ] = useState( false );
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal: ModalProps[ 'onRequestClose' ] = ( event ) => {
		setOpen( false );
		onRequestClose( event );
	};
	const headerActions = (
		<>
			<Button
				icon={ isLiked ? starFilled : starEmpty }
				label="Like"
				onClick={ () => setIsLiked( ! isLiked ) }
			/>
			<Tooltip text="We are here to help!">
				<Button icon={ help } label="Help" />
			</Tooltip>
		</>
	);

	return (
		<>
			<Button variant="secondary" onClick={ openModal }>
				Open Modal with Header Actions
			</Button>
			{ isOpen && (
				<Modal
					style={ { maxWidth: '600px' } }
					isDismissible={ false }
					onRequestClose={ closeModal }
					headerActions={ headerActions }
					{ ...args }
				>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit,
						sed do eiusmod tempor incididunt ut labore et magna
						aliqua.
					</p>
					<Button variant="secondary" onClick={ closeModal }>
						Close Modal
					</Button>
				</Modal>
			) }
		</>
	);
};
export const Default: ComponentStory< typeof Modal > = Template.bind( {} );
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

export const WithHeaderActions: ComponentStory< typeof Modal > =
	TemplateWithHeaderActions.bind( {} );
WithHeaderActions.args = {
	...Default.args,
};
WithHeaderActions.argTypes = {
	isDismissible: {
		control: { type: 'boolean' },
	},
};
WithHeaderActions.parameters = {
	...Default.parameters,
};
