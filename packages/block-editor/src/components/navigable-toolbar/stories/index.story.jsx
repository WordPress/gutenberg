import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import NavigableToolbar from '../';

const meta = {
	title: 'BlockEditor/NavigableToolbar',
	component: NavigableToolbar,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: __(
					'A toolbar that can be navigated with a keyboard.'
				),
			},
		},
	},
	argTypes: {
		focusOnMount: {
			control: { type: 'boolean' },
			description: __(
				'Whether to immediately focus when the component mounts (Deprecated).'
			),
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
			deprecated: true,
		},
		focusEditorOnEscape: {
			control: { type: 'boolean' },
			description: __(
				'Whether to focus back to editor when pressing escape.'
			),
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
		},
		shouldUseKeyboardFocusShortcut: {
			control: { type: 'boolean' },
			description: __(
				'Whether the toolbar should respond to keyboard focus shortcut (Alt+F10).'
			),
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: true },
			},
		},
		orientation: {
			control: { type: 'select' },
			options: [ 'horizontal', 'vertical' ],
			description: __( 'The orientation of the toolbar.' ),
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: 'horizontal' },
			},
		},
		'aria-label': {
			control: { type: 'text' },
			description: __( 'Accessibility label for the toolbar.' ),
			table: {
				type: { summary: 'string' },
			},
		},
	},
	args: {
		focusOnMount: false,
		focusEditorOnEscape: false,
		shouldUseKeyboardFocusShortcut: true,
		orientation: 'horizontal',
		'aria-label': __( 'Toolbar' ),
	},
};

export default meta;

export const Default = {
	render: function Template( args ) {
		return (
			<NavigableToolbar { ...args }>
				<Button __next40pxDefaultSize variant="primary">
					{ __( 'Button 1' ) }
				</Button>
				<Button __next40pxDefaultSize>{ __( 'Button 2' ) }</Button>
				<Button __next40pxDefaultSize>{ __( 'Button 3' ) }</Button>
			</NavigableToolbar>
		);
	},
};

export const VerticalOrientation = {
	render: function Template( args ) {
		return (
			<NavigableToolbar { ...args } orientation="vertical">
				<Button __next40pxDefaultSize variant="primary">
					{ __( 'Button 1' ) }
				</Button>
				<Button __next40pxDefaultSize>{ __( 'Button 2' ) }</Button>
				<Button __next40pxDefaultSize>{ __( 'Button 3' ) }</Button>
			</NavigableToolbar>
		);
	},
};

export const WithKeyboardNavigation = {
	render: function Template( args ) {
		return (
			<div>
				<p>
					{ __(
						'Press Alt+F10 to focus the toolbar. Use arrow keys to navigate between buttons.'
					) }
				</p>
				<NavigableToolbar { ...args } shouldUseKeyboardFocusShortcut>
					<Button __next40pxDefaultSize variant="primary">
						{ __( 'Button 1' ) }
					</Button>
					<Button __next40pxDefaultSize>{ __( 'Button 2' ) }</Button>
					<Button __next40pxDefaultSize>{ __( 'Button 3' ) }</Button>
				</NavigableToolbar>
			</div>
		);
	},
};

export const WithEscapeBehavior = {
	render: function Template( args ) {
		return (
			<div>
				<p>
					{ __(
						'Focus the toolbar and press Escape to return focus to the editor.'
					) }
				</p>
				<NavigableToolbar { ...args } focusEditorOnEscape>
					<Button __next40pxDefaultSize variant="primary">
						{ __( 'Button 1' ) }
					</Button>
					<Button __next40pxDefaultSize>{ __( 'Button 2' ) }</Button>
					<Button __next40pxDefaultSize>{ __( 'Button 3' ) }</Button>
				</NavigableToolbar>
			</div>
		);
	},
};
