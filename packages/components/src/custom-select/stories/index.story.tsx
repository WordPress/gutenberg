//@ts-nocheck
/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import CustomSelect from '..';

const meta: Meta< typeof CustomSelect > = {
	title: 'Components/CustomSelect',
	component: CustomSelect,
	argTypes: {},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof CustomSelect > = ( props ) => (
	<CustomSelect { ...props } />
);

export const Default: StoryFn< typeof CustomSelect > = Template.bind( {} );
Default.args = {
	label: 'Label',
	children: (
		<>
			<CustomSelect.Item
				style={ { fontSize: '50%' } }
				key="small"
				value="Small"
			>
				Small
			</CustomSelect.Item>
			<CustomSelect.Item
				key="default"
				style={ { fontSize: '100%' } }
				value="Default"
			>
				Default
			</CustomSelect.Item>
			<CustomSelect.Item
				key="large"
				style={ { fontSize: '200%' } }
				value="Large"
			>
				Large
			</CustomSelect.Item>
			<CustomSelect.Item
				key="huge"
				style={ { fontSize: '300%' } }
				value="Huge"
			>
				Huge
			</CustomSelect.Item>
		</>
	),
};
