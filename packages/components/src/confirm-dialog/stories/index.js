/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { ConfirmDialog } from '..';

const meta = {
	component: ConfirmDialog,
	title: 'Components (Experimental)/ConfirmDialog',
	argTypes: {
		children: {
			control: { type: 'text' },
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
		onConfirm: { action: 'onConfirm' },
		onCancel: { action: 'onCancel' },
	},
	args: {
		children: 'Would you like to privately publish the post now?',
	},
	parameters: {
		docs: { source: { state: 'open' } },
	},
};

export default meta;

const Template = ( { onConfirm, onCancel, ...args } ) => {
	const [ isOpen, setIsOpen ] = useState( false );

	const handleConfirm = ( ...confirmArgs ) => {
		onConfirm( ...confirmArgs );
		setIsOpen( false );
	};

	const handleCancel = ( ...cancelArgs ) => {
		onCancel( ...cancelArgs );
		setIsOpen( false );
	};

	return (
		<>
			<Button variant="primary" onClick={ () => setIsOpen( true ) }>
				Open ConfirmDialog
			</Button>

			<ConfirmDialog
				{ ...args }
				isOpen={ isOpen }
				onConfirm={ handleConfirm }
				onCancel={ handleCancel }
			>
				{ args.children }
			</ConfirmDialog>
		</>
	);
};

// Simplest usage: just declare the component with the required `onConfirm` prop. Note: the `onCancel` prop is optional here, unless you'd like to render the component in Controlled mode (see below)
export const _default = Template.bind( {} );
const _defaultSnippet = `() => {
  const [ isOpen, setIsOpen ] = useState( false );
  const [ confirmVal, setConfirmVal ] = useState('');

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
  };`;
_default.args = {};
_default.parameters = {
	docs: {
		source: {
			code: _defaultSnippet,
			language: 'jsx',
			type: 'auto',
			format: 'true',
		},
	},
};

// To customize button text, pass the `cancelButtonText` and/or `confirmButtonText` props.
export const withCustomButtonLabels = Template.bind( {} );
withCustomButtonLabels.args = {
	cancelButtonText: 'No thanks',
	confirmButtonText: 'Yes please!',
};
