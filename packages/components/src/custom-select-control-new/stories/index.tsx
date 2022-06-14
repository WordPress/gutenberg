/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
// import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CustomSelectControl, CustomSelectControlItem } from '../';

const meta: ComponentMeta< typeof CustomSelectControl > = {
	component: CustomSelectControl,
	title: 'Components (Experimental)/CustomSelectControlNew',
	argTypes: {},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

// TODO:
// - with options prop
// - controlled vs uncontrolled
// - with HTML "options"?
// - example with custom author dropdown

const DefaultTemplate: ComponentStory< typeof CustomSelectControl > = ( {
	onChange,
	...args
} ) => {
	// const [ value, setValue ] = useState< string | undefined >( '10px' );

	return (
		<CustomSelectControl { ...args }>
			<CustomSelectControlItem value="Venus" />
			<CustomSelectControlItem value="Earth">
				Planet Earth
			</CustomSelectControlItem>
			<CustomSelectControlItem value="Mars" />
			<CustomSelectControlItem value="Jupiter" disabled />
			<CustomSelectControlItem value="Neptune" />
		</CustomSelectControl>
	);
};

export const Default: ComponentStory< typeof CustomSelectControl > =
	DefaultTemplate.bind( {} );
Default.args = {
	label: 'With `CustomSelectControlItem` children',
};
