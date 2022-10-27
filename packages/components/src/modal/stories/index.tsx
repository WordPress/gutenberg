/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
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

const IFrame: FC< { title?: string; width: number; height: number } > = ( {
	children,
	...props
} ) => {
	const [ contentRef, setContentRef ] = useState< HTMLIFrameElement | null >(
		null
	);
	const mountNode = contentRef?.contentWindow?.document?.body;

	return (
		<iframe
			title="test-iframe"
			{ ...props }
			ref={ setContentRef }
			onBlur={ () => console.log( 'iframe blurred' ) }
			onFocus={ () => console.log( 'iframe focused' ) }
			tabIndex={ -1 }
		>
			{ mountNode && createPortal( children, mountNode ) }
		</iframe>
	);
};

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

					<button>Ciao</button>

					<iframe
						title="Example 1"
						width="300"
						height="200"
						src="https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752641776%2C0.00030577182769775396%2C51.478569861898606&layer=mapnik"
					/>

					<IFrame title="Example 2" width={ 300 } height={ 200 }>
						<button>Ciao</button>
					</IFrame>

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
