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
import { CustomSelect, CustomSelectItem } from '..';

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

const Template: StoryFn = () => {
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

	return (
		<>
			<CustomSelect label="Font Size" options={ options } />
		</>
	);
};

export const Default = Template.bind( {} );
