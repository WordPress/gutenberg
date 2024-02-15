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
import CustomSelect from '../default-component';
import { CustomSelectItem } from '..';

const meta: Meta< typeof CustomSelect > = {
	title: 'Components (Experimental)/CustomSelectControl v2/Default',
	component: CustomSelect,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CustomSelectItem,
	},
	argTypes: {
		children: { control: { type: null } },
		value: { control: { type: null } },
	},
	tags: [ 'status-wip' ],
	parameters: {
		badges: [ 'wip' ],
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
};
export default meta;

const Template: StoryFn< typeof CustomSelect > = ( props ) => {
	const [ value, setValue ] = useState< string | string[] >();
	return (
		<CustomSelect
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
			<CustomSelectItem value="Blue">
				<span style={ { color: 'blue' } }>Blue</span>
			</CustomSelectItem>
			<CustomSelectItem value="Purple">
				<span style={ { color: 'purple' } }>Purple</span>
			</CustomSelectItem>
			<CustomSelectItem value="Pink">
				<span style={ { color: 'deeppink' } }>Pink</span>
			</CustomSelectItem>
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
				<CustomSelectItem key={ item } value={ item }>
					{ item }
				</CustomSelectItem>
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
					<CustomSelectItem key={ option } value={ option }>
						{ renderItem( option ) }
					</CustomSelectItem>
				)
			) }
		</>
	),
};
