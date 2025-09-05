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
import CustomSelectControl from '..';

const meta: Meta< typeof CustomSelectControl > = {
	title: 'Components/Selection & Input/Common/CustomSelectControl',
	component: CustomSelectControl,
	id: 'components-customselectcontrol',
	argTypes: {
		onChange: { control: false },
		value: { control: false },
	},
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
};
export default meta;

const Template: StoryFn< typeof CustomSelectControl > = ( props ) => {
	const [ value, setValue ] = useState( props.options[ 0 ] );

	const onChange: React.ComponentProps<
		typeof CustomSelectControl
	>[ 'onChange' ] = ( changeObject ) => {
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

export const Default = Template.bind( {} );
Default.args = {
	__next40pxDefaultSize: true,
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

export const WithLongLabels = Template.bind( {} );
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

export const WithHints = Template.bind( {} );
WithHints.args = {
	...Default.args,
	options: [
		{
			key: 'thumbnail',
			name: 'Thumbnail',
			hint: '150x150',
		},
		{
			key: 'medium',
			name: 'Medium',
			hint: '250x250',
		},
		{
			key: 'large',
			name: 'Large',
			hint: '1024x1024',
		},
		{
			key: 'full',
			name: 'Full Size',
			hint: '1600x1600',
		},
	],
};
