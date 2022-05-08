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
import CheckboxControl from '..';

const meta: ComponentMeta< typeof CheckboxControl > = {
	component: CheckboxControl,
	title: 'Components/CheckboxControl',
	argTypes: {
		onChange: {
			action: 'onChange',
		},
		checked: {
			control: { type: null },
		},
		help: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof CheckboxControl > = ( {
	onChange,
	...args
} ) => {
	const [ isChecked, setChecked ] = useState( true );

	return (
		<CheckboxControl
			{ ...args }
			checked={ isChecked }
			onChange={ ( v ) => {
				setChecked( v );
				onChange( v );
			} }
		/>
	);
};

const IndeterminateTemplate: ComponentStory< typeof CheckboxControl > = ( {
	onChange,
	...args
} ) => {
	const [ fruits, setFruits ] = useState( { apple: false, orange: false } );

	const isAllChecked = Object.values( fruits ).every( Boolean );
	const isIndeterminate =
		Object.values( fruits ).some( Boolean ) && ! isAllChecked;

	return (
		<>
			<CheckboxControl
				{ ...args }
				checked={ isAllChecked }
				indeterminate={ isIndeterminate }
				onChange={ ( v ) => {
					setFruits( {
						apple: v,
						orange: v,
					} );
					onChange( v );
				} }
			/>
			<CheckboxControl
				label="Apple"
				checked={ fruits.apple }
				onChange={ ( apple ) =>
					setFruits( ( prevState ) => ( {
						...prevState,
						apple,
					} ) )
				}
			/>
			<CheckboxControl
				label="Orange"
				checked={ fruits.orange }
				onChange={ ( orange ) =>
					setFruits( ( prevState ) => ( {
						...prevState,
						orange,
					} ) )
				}
			/>
		</>
	);
};

export const Default: ComponentStory<
	typeof CheckboxControl
> = DefaultTemplate.bind( {} );
Default.args = {};

export const WithLabel: ComponentStory<
	typeof CheckboxControl
> = DefaultTemplate.bind( {} );
WithLabel.args = {
	...Default.args,
	label: 'Is author',
};

export const WithLabelAndHelpText: ComponentStory<
	typeof CheckboxControl
> = DefaultTemplate.bind( {} );
WithLabelAndHelpText.args = {
	...Default.args,
	label: 'Is author',
	help: 'Is the user an author or not?',
};

export const Indeterminate: ComponentStory<
	typeof CheckboxControl
> = IndeterminateTemplate.bind( {} );
Indeterminate.args = {
	label: 'Select all',
};
