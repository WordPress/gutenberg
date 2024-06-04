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
import { HStack } from '../../h-stack';

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

/**
 * For more complex designs, a custom `<label>` element can be associated with the checkbox
 * by leaving the `label` prop undefined and using the `id` and `htmlFor` props instead.
 * Because the label element also functions as a click target for the checkbox, [do not
 * place interactive elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#interactive_content)
 * such as links or buttons inside the `<label>` node.
 *
 * Similarly, a custom description can be added by omitting the `help` prop
 * and using the `aria-describedby` prop instead.
 */
export const WithCustomLabel: StoryFn< typeof CheckboxControl > = ( {
	onChange,
	...args
} ) => {
	const [ isChecked, setChecked ] = useState( true );

	return (
		<HStack justify="flex-start" alignment="top" spacing={ 0 }>
			<CheckboxControl
				{ ...args }
				checked={ isChecked }
				onChange={ ( v ) => {
					setChecked( v );
					onChange( v );
				} }
				// Disable reason: For simplicity of the code snippet.
				// eslint-disable-next-line no-restricted-syntax
				id="my-checkbox-with-custom-label"
				aria-describedby="my-custom-description"
			/>
			<VStack>
				<label htmlFor="my-checkbox-with-custom-label">
					My custom label
				</label>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<div id="my-custom-description" style={ { fontSize: 13 } }>
					A custom description.
				</div>
			</VStack>
		</HStack>
	);
};
WithCustomLabel.args = {
	__nextHasNoMarginBottom: true,
};
