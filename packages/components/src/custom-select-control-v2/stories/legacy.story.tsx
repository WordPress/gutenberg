//@ts-nocheck
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
import { CustomSelect, CustomSelectItem } from '..';

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

export const Default: StoryFn = () => {
	const options = [
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
	];

	return <CustomSelect label="Font Size" options={ options } />;
};

export const Controlled: StoryFn = () => {
	const options = [
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
	];

	const [ fontSize, setFontSize ] = useState( options[ 0 ] );

	return (
		<CustomSelect
			label="Font Size"
			options={ options }
			onChange={ ( { selectedItem } ) => {
				setFontSize( selectedItem );
			} }
			value={ options.find( ( option ) => option.key === fontSize.key ) }
		/>
	);
};
