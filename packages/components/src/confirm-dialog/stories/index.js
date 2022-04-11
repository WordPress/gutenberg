/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { Heading } from '../../heading';
import { ConfirmDialog } from '..';

const meta = {
	component: ConfirmDialog,
	title: 'Components (Experimental)/ConfirmDialog',
	argTypes: {
		children: {
			control: { type: 'text' },
		},
		jsxChildren: {
			control: {
				type: 'select',
				options: [
					'<b>Bold text</b>',
					'<i>Italic text</i>',
					'<Heading level={ 2 }>A JSX Heading</Heading>',
				],
			},
			mapping: {
				'<b>Bold text</b>': <b>Bold text</b>,
				'<i>Italic text</i>': <i>Italic text</i>,
				'<Heading level={ 2 }>A JSX Heading</Heading>': (
					<Heading level={ 2 }>A JSX Heading</Heading>
				),
			},
		},
		confirmButtonText: {
			control: { type: 'text' },
		},
		cancelButtonText: {
			control: { type: 'text' },
		},
		isOpen: {
			control: { type: null },
		},
		onConfirm: {
			control: { type: null },
		},
		onCancel: {
			control: { type: null },
		},
	},
	args: {
		children: 'Would you like to privately publish the post now?',
	},
	parameters: {
		// Exclude jsxChildren by default becuase it's only used in one story.
		controls: {
			exclude: 'jsxChildren',
		},
		docs: { source: { state: 'open' } },
	},
};

export default meta;

const Template = ( args ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ confirmVal, setConfirmVal ] = useState( '' );
	const children = args.jsxChildren ?? args.children;

	const handleConfirm = () => {
		setConfirmVal( 'Confirmed!' );
		setIsOpen( false );
	};

	const handleCancel = () => {
		setConfirmVal( 'Cancelled' );
		setIsOpen( false );
	};
	return (
		<>
			<Button variant="primary" onClick={ () => setIsOpen( true ) }>
				Open ConfirmDialog
			</Button>

			<ConfirmDialog
				isOpen={ isOpen }
				onConfirm={ handleConfirm }
				onCancel={ handleCancel }
				cancelButtonText={ args.cancelButtonText }
				confirmButtonText={ args.confirmButtonText }
			>
				{ children }
			</ConfirmDialog>

			<Heading level={ 1 }>{ confirmVal }</Heading>
		</>
	);
};

// Simplest usage: just declare the component with the required `onConfirm` prop.
export const _default = Template.bind( {} );
_default.args = {};

// To customize button text, pass the `cancelButtonText` and/or `confirmButtonText` props.
export const withCustomButtonLabels = Template.bind( {} );
withCustomButtonLabels.args = {
	cancelButtonText: 'No thanks',
	confirmButtonText: 'Yes please!',
};

// Controlled `ConfirmDialog`s require both `onConfirm` *and* `onCancel` to be passed.
// It's also necessary to explicitly close the dialog when needed. See `setIsOpen` calls below.
export const Controlled = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ confirmVal, setConfirmVal ] = useState(
		"Hasn't confirmed or cancelled yet"
	);

	const handleConfirm = () => {
		setConfirmVal( 'Confirmed!' );
		setIsOpen( false );
	};

	const handleCancel = () => {
		setConfirmVal( 'Cancelled' );
		setIsOpen( false );
	};

	return (
		<>
			<ConfirmDialog
				isOpen={ isOpen }
				onConfirm={ handleConfirm }
				onCancel={ handleCancel }
			>
				Would you like to privately publish the post now?
			</ConfirmDialog>

			<Heading level={ 1 }>{ confirmVal }</Heading>

			<Button variant="primary" onClick={ () => setIsOpen( true ) }>
				Open ConfirmDialog
			</Button>
		</>
	);
};
