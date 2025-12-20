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
import FormToggle from '..';

const meta: Meta< typeof FormToggle > = {
	component: FormToggle,
	title: 'Components/FormToggle',
	argTypes: {
		onChange: {
			action: 'onChange',
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof FormToggle > = ( { onChange, ...args } ) => {
	const [ isChecked, setChecked ] = useState( true );

	return (
		<FormToggle
			{ ...args }
			checked={ isChecked }
			onChange={ ( e ) => {
				setChecked( ( state ) => ! state );
				onChange( e );
			} }
		/>
	);
};

export const Default: StoryFn< typeof FormToggle > = Template.bind( {} );
Default.args = {};
