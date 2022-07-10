/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Elevation } from '..';

const meta: ComponentMeta< typeof Elevation > = {
	component: Elevation,
	title: 'Components (Experimental)/Elevation',
	argTypes: {
		as: { control: { type: 'text' } },
		borderRadius: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Elevation > = ( args ) => {
	/* eslint-disable jsx-a11y/anchor-is-valid */
	return (
		<a
			href="#"
			onClick={ ( e ) => e.preventDefault() }
			style={ {
				border: 0,
				background: 'transparent',
				display: 'block',
				width: 150,
				height: 150,
				position: 'relative',
				margin: '20vh auto',
			} }
		>
			<Elevation { ...args } />
		</a>
	);
	/* eslint-enable jsx-a11y/anchor-is-valid */
};

export const Default: ComponentStory< typeof Elevation > = Template.bind( {} );
Default.args = {
	value: 5,
	hover: 5,
	active: 1,
	focus: 10,
};
