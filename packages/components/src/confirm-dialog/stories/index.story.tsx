/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { ConfirmDialog } from '../component';

const meta: Meta< typeof ConfirmDialog > = {
	component: ConfirmDialog,
	title: 'Components/Overlays/ConfirmDialog',
	id: 'components-confirmdialog',
	argTypes: {
		isOpen: {
			control: false,
		},
	},
	tags: [ 'status-experimental' ],
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};

export default meta;

const Template: StoryFn< typeof ConfirmDialog > = ( {
	onConfirm,
	onCancel,
	...args
} ) => {
	const [ isOpen, setIsOpen ] = useState( false );

	const handleConfirm: typeof onConfirm = ( confirmArgs ) => {
		onConfirm( confirmArgs );
		setIsOpen( false );
	};

	const handleCancel: typeof onCancel = ( cancelArgs ) => {
		onCancel?.( cancelArgs );
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
export const Default = Template.bind( {} );
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
Default.args = {
	children: 'Would you like to privately publish the post now?',
};
Default.parameters = {
	docs: {
		source: {
			code: _defaultSnippet,
			language: 'jsx',
			type: 'auto',
		},
	},
};

// To customize button text, pass the `cancelButtonText` and/or `confirmButtonText` props.
export const WithCustomButtonLabels = Template.bind( {} );
WithCustomButtonLabels.args = {
	...Default.args,
	cancelButtonText: 'No thanks',
	confirmButtonText: 'Yes please!',
};

// To show a busy state while an action is being performed, pass the `isBusy` prop.
export const WithBusyState = Template.bind( {} );
const _withBusyStateSnippet = `() => {
  const [ isOpen, setIsOpen ] = useState( false );
  const [ isBusy, setIsBusy ] = useState( false );

  const handleConfirm = async () => {
    setIsBusy( true );
    // Simulate an async operation.
	// In a real-world scenario, you would replace this with an async operation, such as an API call.
    await new Promise( ( resolve ) => setTimeout( resolve, 2000 ) );
    setIsBusy( false );
    setIsOpen( false );
  };

  const handleCancel = () => {
    setIsBusy( false );
    setIsOpen( false );
  };

  return (
    <>
      <ConfirmDialog
        isOpen={ isOpen }
        onConfirm={ handleConfirm }
        onCancel={ handleCancel }
        isBusy={ isBusy }
      >
        Are you sure you want to delete this item?
      </ConfirmDialog>

      <Button variant="primary" onClick={ () => setIsOpen( true ) }>
        Open ConfirmDialog
      </Button>
    </>
  );
};`;
WithBusyState.args = {
	...Default.args,
	isBusy: true,
};
WithBusyState.parameters = {
	docs: {
		source: {
			code: _withBusyStateSnippet,
			language: 'jsx',
			type: 'auto',
		},
	},
};
