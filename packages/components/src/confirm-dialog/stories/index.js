/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

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

export default {
	component: ConfirmDialog,
	title: 'Components (Experimental)/ConfirmDialog',
	argTypes: {
		children: {
			type: 'reactNode',
		},
		title: {
			type: 'string',
		},
		confirmButtonText: {
			type: 'string',
		},
		cancelButtonText: {
			type: 'string',
		},
		isOpen: {
			type: 'boolean',
		},
	},
};

const daText = () =>
	text( 'message', 'Would you like to privately publish the post now?' );

const Template = ( args ) => {
	const [ confirmVal, setConfirmVal ] = useState( "Hasn't confirmed yet" );
	const confirmOutput = args.confirmOutput ?? 'Confirmed!';
	const modalText = args.jsxMessage ? (
		<Heading level={ 2 }>{ args.children }</Heading>
	) : (
		args.children
	);

	return (
		<>
			<ConfirmDialog
				title={ args.title }
				onConfirm={ () => setConfirmVal( confirmOutput ) }
				onCancel={
					args.cancelOutput
						? () => setConfirmVal( args.cancelOutput )
						: undefined
				}
				cancelButtonText={ args.cancelButtonText }
				confirmButtonText={ args.confirmButtonText }
			>
				{ modalText }
			</ConfirmDialog>

			<Heading level={ 1 }>{ confirmVal }</Heading>
		</>
	);
};

// Simplest usage: just declare the component with the required `onConfirm` prop.
export const _default = Template.bind( {} );
_default.args = {
	children: daText(),
};

// To add a title, pass the `title` prop
export const WithTitle = Template.bind( {} );
WithTitle.args = {
	title: 'Example Title',
	children: daText(),
};

// To customize button text, pass the `cancelButtonText` and/or `confirmButtonText` props.
export const withCustomButtonLabels = Template.bind( {} );
withCustomButtonLabels.args = {
	children: daText(),
	cancelButtonText: 'No thanks',
	confirmButtonText: 'Yes please!',
};

// To use a JSX message, wrap your text in the appropriate JSX tags.
export const WithJSXMessage = Template.bind( {} );
WithJSXMessage.args = {
	children: daText(),
	jsxMessage: true,
};
// Hide the jsxMessage control, as it isn't an actual prop
WithJSXMessage.parameters = {
	controls: { exclude: [ 'jsxMessage' ] },
};

export const VeeeryLongMessage = Template.bind( {} );
VeeeryLongMessage.args = {
	children: daText().repeat( 20 ),
};

export const UncontrolledAndWithExplicitOnCancel = Template.bind( {} );
UncontrolledAndWithExplicitOnCancel.args = {
	children: daText(),
	confirmOutput: 'Confirmed!',
	cancelOutput: 'Cancelled',
};

// Controlled `ConfirmDialog`s require both `onConfirm` *and* `onCancel` to be passed.
// It's also necessary to explicitely close the dialog when needed. See `setIsOpen` calls below.
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
				{ daText() }
			</ConfirmDialog>

			<Heading level={ 1 }>{ confirmVal }</Heading>

			<Button variant="primary" onClick={ () => setIsOpen( true ) }>
				Open ConfirmDialog
			</Button>
		</>
	);
};
