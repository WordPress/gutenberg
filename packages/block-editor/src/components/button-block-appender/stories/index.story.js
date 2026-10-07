/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ButtonBlockAppender from '../';

const meta = {
	title: 'BlockEditor/ButtonBlockAppender',
	component: ButtonBlockAppender,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: __(
					'A block appender button that allows users to add new blocks.'
				),
			},
		},
	},
	argTypes: {
		rootClientId: {
			control: { type: 'text' },
			description: __(
				'The root client ID where new blocks will be inserted'
			),
			table: {
				type: { summary: 'string' },
			},
		},
		className: {
			control: { type: 'text' },
			description: __(
				'Additional CSS class name to be added to the button'
			),
			table: {
				type: { summary: 'string' },
			},
		},
		onFocus: {
			action: 'onFocus',
			description: __( 'Callback function when button receives focus' ),
			table: {
				type: { summary: 'function' },
			},
		},
		tabIndex: {
			control: { type: 'number' },
			description: __( 'Tab index for the button' ),
			table: {
				type: { summary: 'number' },
			},
		},
		onSelect: {
			action: 'onSelect',
			description: __( 'Callback function when a block is selected' ),
			table: {
				type: { summary: 'function' },
			},
		},
	},
	args: {
		rootClientId: '',
		className: '',
		tabIndex: 0,
	},
};

export default meta;

export const Default = {
	render: function Template( args ) {
		return <ButtonBlockAppender { ...args } />;
	},
};

export const WithCustomClassName = {
	render: function Template( args ) {
		return (
			<ButtonBlockAppender
				{ ...args }
				className="custom-appender-class"
			/>
		);
	},
};

export const WithRootClientId = {
	render: function Template( args ) {
		return (
			<ButtonBlockAppender
				{ ...args }
				rootClientId="test-root-client-id"
			/>
		);
	},
};

export const WithCustomTabIndex = {
	render: function Template( args ) {
		return <ButtonBlockAppender { ...args } tabIndex={ -1 } />;
	},
};

export const WithCallbacks = {
	render: function Template( args ) {
		const handleFocus = () => {
			// eslint-disable-next-line no-console
			console.log( 'Button focused' );
		};

		const handleSelect = ( block ) => {
			// eslint-disable-next-line no-console
			console.log( 'Block selected:', block );
		};

		return (
			<div>
				<p>
					{ __(
						'Open browser console to see focus and select events.'
					) }
				</p>
				<ButtonBlockAppender
					{ ...args }
					onFocus={ handleFocus }
					onSelect={ handleSelect }
				/>
			</div>
		);
	},
};
