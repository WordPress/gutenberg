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
import CheckboxControl from '..';
import { VStack } from '../../v-stack';

const meta: Meta< typeof CheckboxControl > = {
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
			exclude: [ 'heading' ],
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const DefaultTemplate: StoryFn< typeof CheckboxControl > = ( {
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

export const Default: StoryFn< typeof CheckboxControl > = DefaultTemplate.bind(
	{}
);
Default.args = {
	label: 'Is author',
	help: 'Is the user an author or not?',
};

export const Indeterminate: StoryFn< typeof CheckboxControl > = ( {
	onChange,
	...args
} ) => {
	const [ fruits, setFruits ] = useState( { apple: false, orange: false } );

	const isAllChecked = Object.values( fruits ).every( Boolean );
	const isIndeterminate =
		Object.values( fruits ).some( Boolean ) && ! isAllChecked;

	return (
		<VStack>
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
				__nextHasNoMarginBottom
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
				__nextHasNoMarginBottom
				label="Orange"
				checked={ fruits.orange }
				onChange={ ( orange ) =>
					setFruits( ( prevState ) => ( {
						...prevState,
						orange,
					} ) )
				}
			/>
		</VStack>
	);
};
Indeterminate.args = {
	label: 'Select all',
	__nextHasNoMarginBottom: true,
};
