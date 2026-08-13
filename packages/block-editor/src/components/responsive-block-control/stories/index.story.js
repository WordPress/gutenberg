/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ResponsiveBlockControl from '..';

const meta = {
	title: 'BlockEditor/ResponsiveBlockControl',
	component: ResponsiveBlockControl,
	parameters: {
		docs: {
			description: {
				component:
					'The `ResponsiveBlockControl` component provides a UI to toggle between a single value for all screen sizes and custom values for different screen sizes.',
			},
		},
	},
	argTypes: {
		title: {
			description:
				"The title of the control group used in the `fieldset`'s `legend` element to label the _entire_ set of controls.",
			control: 'text',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: 'undefined' },
			},
		},
		property: {
			description:
				'Used to build accessible labels and ARIA roles for the control group. Should represent the layout property which the component controls (eg: `padding`, `margin`...etc).',
			control: 'text',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: 'undefined' },
			},
		},
		isResponsive: {
			description:
				'Determines whether the component displays the default or responsive controls. Updates the state of the toggle control. See also `onIsResponsiveChange` below.',
			control: 'boolean',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
		},
		onIsResponsiveChange: {
			description:
				"A callback function invoked when the component's toggle value is changed between responsive and non-responsive mode. Should be used to update the value of the `isResponsive` prop to reflect the current state of the toggle control.",
			action: 'onIsResponsiveChange',
			table: {
				type: { summary: 'function' },
				defaultValue: { summary: undefined },
			},
		},
		renderDefaultControl: {
			description:
				'A render function (prop) used to render the control for which you would like to display per viewport settings.',
			control: 'function',
			table: {
				type: { summary: 'function' },
				defaultValue: { summary: 'undefined' },
			},
		},
		renderResponsiveControls: {
			description:
				'An optional render function (prop) used to render the controls for the _responsive_ settings. If not provided, by default, responsive controls will be _automatically_ rendered using the component returned by the `renderDefaultControl` prop.',
			control: 'function',
			table: {
				type: { summary: 'function' },
				defaultValue: { summary: 'undefined' },
			},
		},
		toggleLabel: {
			description:
				'Optional label used for the toggle control which switches the interface between showing responsive controls or not.',
			control: 'text',
			table: {
				type: { summary: 'string' },
			},
		},

		defaultLabel: {
			description: 'Default label for the "All" control.',
			control: 'object',
			table: {
				type: { summary: 'object' },
				defaultValue: {
					summary: `{ id: 'all', label: 'All' }`,
				},
			},
		},
		viewports: {
			description:
				'Defines the viewport labels and IDs for responsive controls.',
			control: 'array',
			table: {
				type: { summary: 'array' },
				defaultValue: {
					summary: `[{ id: 'small', label: 'Small screens', }, { id: 'medium', label: 'Medium screens', }, { id: 'large', label: 'Large screens', }]`,
				},
			},
		},
	},
};
export default meta;

const Template = ( args ) => {
	const [ isResponsive, setIsResponsive ] = useState( args.isResponsive );

	const style = {
		marginTop: '1em',
		marginBottom: '1em',
		display: 'flex',
		gap: '1em',
	};

	const renderDefaultControl = ( label ) => (
		<div style={ style }>
			{ label }
			<input type="text" placeholder="Enter value" />
		</div>
	);

	return (
		<ResponsiveBlockControl
			{ ...args }
			isResponsive={ isResponsive }
			onIsResponsiveChange={ () => setIsResponsive( ! isResponsive ) }
			renderDefaultControl={ renderDefaultControl }
		/>
	);
};

export const Default = {
	render: Template,
	args: {
		title: 'Margin',
		property: 'margin',
		toggleLabel: __( 'Use the same margin on all screen sizes' ),
		defaultLabel: {
			id: 'all',
			label: 'All',
		},
		viewports: [
			{ id: 'small', label: __( 'Small screens' ) },
			{ id: 'medium', label: __( 'Medium screens' ) },
			{ id: 'large', label: __( 'Large screens' ) },
		],
		isResponsive: false,
	},
};
