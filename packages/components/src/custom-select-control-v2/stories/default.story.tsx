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
import NewCustomSelect from '../default-component';
import { CustomSelect, CustomSelectItem } from '..';

const meta: Meta< typeof NewCustomSelect > = {
	title: 'Components (Experimental)/CustomSelectControl v2/Default',
	component: NewCustomSelect,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CustomSelectItem,
	},
	argTypes: {
		children: { control: { type: null } },
		renderSelectedValue: { control: { type: null } },
		value: { control: { type: null } },
	},
	parameters: {
		badges: [ 'wip' ],
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
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

const Template: StoryFn< typeof NewCustomSelect > = ( props ) => {
	return <CustomSelect { ...props } />;
};

const ControlledTemplate: StoryFn< typeof NewCustomSelect > = ( props ) => {
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
	label: 'Label',
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
 * `defaultValue` props. The argument of the `onChange` function will also
 * change accordingly.
 */
export const MultiSelect = Template.bind( {} );
MultiSelect.args = {
	defaultValue: [ 'lavender', 'tangerine' ],
	label: 'Select Colors',
	renderSelectedValue: ( currentValue: string | string[] ) => {
		if ( ! Array.isArray( currentValue ) ) {
			return currentValue;
		}
		if ( currentValue.length === 0 ) return 'No colors selected';
		if ( currentValue.length === 1 ) return currentValue[ 0 ];
		return `${ currentValue.length } colors selected`;
	},
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

const renderControlledValue = ( gravatar: string | string[] ) => {
	const avatar = `https://gravatar.com/avatar?d=${ gravatar }`;
	return (
		<div style={ { display: 'flex', alignItems: 'center' } }>
			<img
				style={ { maxHeight: '75px', marginRight: '10px' } }
				key={ avatar }
				src={ avatar }
				alt=""
				aria-hidden="true"
			/>
			<span>{ gravatar }</span>
		</div>
	);
};

export const Controlled = ControlledTemplate.bind( {} );
Controlled.args = {
	label: 'Default Gravatars',
	defaultValue: 'wavatar',
	renderSelectedValue: renderControlledValue,
	children: (
		<>
			{ [ 'mystery-person', 'identicon', 'wavatar', 'retro' ].map(
				( option ) => (
					<CustomSelectItem key={ option } value={ option }>
						{ renderControlledValue( option ) }
					</CustomSelectItem>
				)
			) }
		</>
	),
};
