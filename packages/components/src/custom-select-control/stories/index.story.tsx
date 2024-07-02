/**
 * External dependencies
 */
import type { StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CustomSelectControl from '..';

export default {
	title: 'Components/CustomSelectControl',
	component: CustomSelectControl,
	argTypes: {
		__next40pxDefaultSize: { control: { type: 'boolean' } },
		__experimentalShowSelectedHint: { control: { type: 'boolean' } },
		size: {
			options: [ 'small', 'default', '__unstable-large' ],
			control: {
				type: 'radio',
			},
		},
		onChange: { control: { type: null } },
		value: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
	},
};

const Template: StoryFn< typeof CustomSelectControl > = ( props ) => {
	const [ value, setValue ] = useState( props.options[ 0 ] );

	const onChange: React.ComponentProps<
		typeof CustomSelectControl
	>[ 'onChange' ] = ( changeObject: { selectedItem: any } ) => {
		setValue( changeObject.selectedItem );
		props.onChange?.( changeObject );
	};

	return (
		<CustomSelectControl
			{ ...props }
			onChange={ onChange }
			value={ value }
		/>
	);
};

export const Default: StoryFn = Template.bind( {} );
Default.args = {
	label: 'Label',
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
			className: 'can-apply-custom-class-to-option',
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

export const WithLongLabels: StoryFn = Template.bind( {} );
WithLongLabels.args = {
	...Default.args,
	options: [
		{
			key: 'reallylonglabel1',
			name: 'Really long labels are good for stress testing',
		},
		{
			key: 'reallylonglabel2',
			name: 'But they can take a long time to type.',
		},
		{
			key: 'reallylonglabel3',
			name: 'That really is ok though because you should stress test your UIs.',
		},
	],
};

export const WithHints: StoryFn = Template.bind( {} );
WithHints.args = {
	...Default.args,
	options: [
		{
			key: 'thumbnail',
			name: 'Thumbnail',
			__experimentalHint: '150x150',
		},
		{
			key: 'medium',
			name: 'Medium',
			__experimentalHint: '250x250',
		},
		{
			key: 'large',
			name: 'Large',
			__experimentalHint: '1024x1024',
		},
		{
			key: 'full',
			name: 'Full Size',
			__experimentalHint: '1600x1600',
		},
	],
};
