/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FormToggle } from '..';

const meta: ComponentMeta< typeof FormToggle > = {
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
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof FormToggle > = ( {
	onChange,
	...args
} ) => {
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

export const Default: ComponentStory< typeof FormToggle > = Template.bind( {} );
Default.args = {};
