/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import { fn } from '@storybook/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CustomSelectControlV2 from '..';

const meta: Meta< typeof CustomSelectControlV2 > = {
	title: 'Components/Selection & Input/Common/CustomSelectControl v2',
	id: 'components-customselectcontrol-v2',
	component: CustomSelectControlV2,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'CustomSelectControlV2.Item': CustomSelectControlV2.Item,
	},
	argTypes: {
		children: { control: false },
		value: { control: false },
	},
	tags: [ 'status-wip' ],
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: {
			source: { excludeDecorators: true },
		},
	},
	decorators: [
		( Story ) => (
			<div
				style={ {
					minHeight: '150px',
				} }
			>
				<Story />
			</div>
		),
	],
	args: {
		onChange: fn(),
	},
};
export default meta;

const Template: StoryFn< typeof CustomSelectControlV2 > = ( props ) => {
	const [ value, setValue ] = useState< string | string[] >();
	return (
		<CustomSelectControlV2
			{ ...props }
			onChange={ ( nextValue: string | string[] ) => {
				setValue( nextValue );
				props.onChange?.( nextValue );
			} }
			value={ value }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	label: 'Label text',
	defaultValue: 'Select a color...',
	children: (
		<>
			<CustomSelectControlV2.Item value="Blue">
				<span style={ { color: 'blue' } }>Blue</span>
			</CustomSelectControlV2.Item>
			<CustomSelectControlV2.Item value="Purple">
				<span style={ { color: 'purple' } }>Purple</span>
			</CustomSelectControlV2.Item>
			<CustomSelectControlV2.Item value="Pink">
				<span style={ { color: 'deeppink' } }>Pink</span>
			</CustomSelectControlV2.Item>
		</>
	),
};

/**
 * Multiple selection can be enabled by using an array for the `value` and
 * `defaultValue` props. The argument type of the `onChange` function will also
 * change accordingly.
 */
export const MultipleSelection = Template.bind( {} );
MultipleSelection.args = {
	label: 'Select Colors',
	defaultValue: [ 'lavender', 'tangerine' ],
	children: (
		<>
			{ [
				'amber',
				'aquamarine',
				'flamingo pink',
				'lavender',
				'maroon',
				'tangerine',
			].map( ( item ) => (
				<CustomSelectControlV2.Item key={ item } value={ item }>
					{ item }
				</CustomSelectControlV2.Item>
			) ) }
		</>
	),
};

const renderItem = ( gravatar: string | string[] ) => {
	const avatar = `https://gravatar.com/avatar?d=${ gravatar }`;
	return (
		<div style={ { display: 'flex', alignItems: 'center' } }>
			<img
				style={ { maxHeight: '75px', marginRight: '10px' } }
				src={ avatar }
				alt=""
			/>
			<span>{ gravatar }</span>
		</div>
	);
};

/**
 * The `renderSelectedValue` prop can be used to customize how the selected value
 * is rendered in the dropdown trigger.
 */
export const CustomSelectedValue = Template.bind( {} );
CustomSelectedValue.args = {
	label: 'Default Gravatars',
	renderSelectedValue: renderItem,
	children: (
		<>
			{ [ 'mystery-person', 'identicon', 'wavatar', 'retro' ].map(
				( option ) => (
					<CustomSelectControlV2.Item key={ option } value={ option }>
						{ renderItem( option ) }
					</CustomSelectControlV2.Item>
				)
			) }
		</>
	),
};
