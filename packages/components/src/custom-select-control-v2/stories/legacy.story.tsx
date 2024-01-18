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
import LegacyCustomSelect from '../legacy-component';
import { CustomSelect } from '..';

const meta: Meta< typeof LegacyCustomSelect > = {
	title: 'Components (Experimental)/CustomSelectControl v2/Legacy',
	component: LegacyCustomSelect,
	argTypes: {
		value: { control: { type: null } },
	},
	parameters: {
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

const Template: StoryFn< typeof LegacyCustomSelect > = ( props ) => {
	return <CustomSelect { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	label: 'Font Size',
	options: [
		{
			key: 'small',
			name: 'Small',
			style: { fontSize: '50%' },
		},
		{
			key: 'normal',
			name: 'Normal',
			style: { fontSize: '100%' },
		},
		{
			key: 'large',
			name: 'Large',
			style: { fontSize: '200%' },
		},
		{
			key: 'huge',
			name: 'Huge',
			style: { fontSize: '300%' },
		},
	],
};

export const Controlled: StoryFn< typeof LegacyCustomSelect > = ( props ) => {
	const [ fontSize, setFontSize ] = useState( props.options[ 0 ] );

	const onChange: ( typeof props )[ 'onChange' ] = ( changeObject ) => {
		setFontSize( changeObject.selectedItem );
		props.onChange?.( changeObject );
	};

	return (
		<CustomSelect { ...props } onChange={ onChange } value={ fontSize } />
	);
};
Controlled.args = {
	label: 'Font Size',
	options: [
		{
			key: 'small',
			name: 'Small',
			style: { fontSize: '50%' },
		},
		{
			key: 'normal',
			name: 'Normal',
			style: { fontSize: '100%' },
		},
		{
			key: 'large',
			name: 'Large',
			style: { fontSize: '200%' },
		},
		{
			key: 'huge',
			name: 'Huge',
			style: { fontSize: '300%' },
		},
	],
};
