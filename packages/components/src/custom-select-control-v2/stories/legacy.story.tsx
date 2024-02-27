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
import CustomSelect from '../legacy-component';

const meta: Meta< typeof CustomSelect > = {
	title: 'Components (Experimental)/CustomSelectControl v2/Legacy',
	component: CustomSelect,
	argTypes: {
		onChange: { control: { type: null } },
		value: { control: { type: null } },
	},
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
	const [ fontSize, setFontSize ] = useState( props.options[ 0 ] );

	const onChange: React.ComponentProps<
		typeof CustomSelect
	>[ 'onChange' ] = ( changeObject ) => {
		setFontSize( changeObject.selectedItem );
		props.onChange?.( changeObject );
	};

	return (
		<CustomSelect { ...props } onChange={ onChange } value={ fontSize } />
	);
};

export const Default = Template.bind( {} );
Default.args = {
	label: 'Label text',
	options: [
		{
			key: 'small',
			name: 'Small',
			style: { fontSize: '50%' },
			__experimentalHint: '50%',
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
