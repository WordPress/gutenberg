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

const daText = () =>
	text( 'message', 'Would you like to privately publish the post now?' );

export default {
	component: ConfirmDialog,
	title: 'Components (Experimental)/ConfirmDialog',
	argTypes: {
		children: {
			type: 'string',
		},
		jsxChildren: {
			type: 'select',
			options: [
				'<b>Bold text</b>',
				'<i>Italic text</i>',
				'<Heading level={ 2 }>A JSX Heading</Heading>',
			],
			mapping: {
				'<b>Bold text</b>': <b>Bold text</b>,
				'<i>Italic text</i>': <i>Italic text</i>,
				'<Heading level={ 2 }>A JSX Heading</Heading>': (
					<Heading level={ 2 }>A JSX Heading</Heading>
				),
			},
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
	args: {
		children: daText(),
	},
	parameters: {
		// Exclude jsxChildren by default becuase it's only used in one story.
		// Because controls don't rerender the component, isOpen isn't actually useful.
		controls: { exclude: [ 'jsxChildren', 'isOpen' ] },
	},
};

const Template = ( args ) => {
	const [ confirmVal, setConfirmVal ] = useState( "Hasn't confirmed yet" );
	const confirmOutput = args.confirmOutput ?? 'Confirmed!';
	const children = args.jsxChildren ?? args.children;

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
				{ children }
			</ConfirmDialog>

			<Heading level={ 1 }>{ confirmVal }</Heading>
		</>
	);
};

// Simplest usage: just declare the component with the required `onConfirm` prop.
export const _default = Template.bind( {} );
_default.args = {};

// To add a title, pass the `title` prop
export const WithTitle = Template.bind( {} );
WithTitle.args = {
	title: 'Example Title',
};

// To customize button text, pass the `cancelButtonText` and/or `confirmButtonText` props.
export const withCustomButtonLabels = Template.bind( {} );
withCustomButtonLabels.args = {
	cancelButtonText: 'No thanks',
	confirmButtonText: 'Yes please!',
};

// JSX elements can be passed as children to further customize the dialog.
export const WithJSXMessage = Template.bind( {} );
WithJSXMessage.args = {
	jsxChildren: '<Heading level={ 2 }>A JSX Heading</Heading>',
};
WithJSXMessage.parameters = {
	controls: { exclude: [ 'children', 'isOpen' ] },
};

export const VeeeryLongMessage = Template.bind( {} );
VeeeryLongMessage.args = {
	children: daText().repeat( 20 ),
};

export const UncontrolledAndWithExplicitOnCancel = Template.bind( {} );
UncontrolledAndWithExplicitOnCancel.args = {
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
