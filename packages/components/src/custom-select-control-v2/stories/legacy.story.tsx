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
import _LegacyCustomSelect from '../legacy-component';
import { CustomSelect } from '..';

const meta: Meta< typeof _LegacyCustomSelect > = {
	title: 'Components (Experimental)/CustomSelectControl v2/Legacy',
	component: _LegacyCustomSelect,
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

const Template: StoryFn< typeof _LegacyCustomSelect > = ( props ) => {
	const [ fontSize, setFontSize ] = useState( props.options[ 0 ] );

	const onChange: React.ComponentProps<
		typeof _LegacyCustomSelect
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
