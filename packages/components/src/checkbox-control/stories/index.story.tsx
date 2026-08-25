import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { wordpress } from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';
import CheckboxControl from '..';
import { VStack } from '../../v-stack';
import { HStack } from '../../h-stack';

const meta: Meta< typeof CheckboxControl > = {
	tags: [ 'manifest' ],
	component: CheckboxControl,
	title: 'Components/Selection & Input/Common/CheckboxControl',
	id: 'components-checkboxcontrol',
	argTypes: {
		onChange: {
			action: 'onChange',
		},
		checked: {
			control: false,
		},
		help: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
			exclude: [ 'heading' ],
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by [`CheckboxControl`](?path=/docs/design-system-components-form-primitives-checkbox--docs) in `@wordpress/ui`, but continue using for now.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof CheckboxControl >;

function ControlledCheckboxControl( {
	onChange,
	...props
}: React.ComponentProps< typeof CheckboxControl > ) {
	const [ isChecked, setChecked ] = useState( true );

	return (
		<CheckboxControl
			{ ...props }
			checked={ isChecked }
			onChange={ ( v ) => {
				setChecked( v );
				onChange( v );
			} }
		/>
	);
}
ControlledCheckboxControl.displayName = 'CheckboxControl';

export const Default: Story = {
	render: ( args ) => <ControlledCheckboxControl { ...args } />,
	args: {
		label: 'Is author',
		help: 'Is the user an author or not?',
	},
};

export const Indeterminate: Story = {
	render: ( { onChange, ...args } ) => {
		const [ fruits, setFruits ] = useState( {
			apple: false,
			orange: false,
		} );

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
			</VStack>
		);
	},
	args: {
		label: 'Select all',
	},
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
export const WithCustomLabel: Story = {
	render: ( { onChange, ...args } ) => {
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
	},
};

/**
 * When adding a visual aid, prefer placing it at the trailing end of the row,
 * rather than placing it directly before the label, or moving the checkbox to the trailing end.
 */
export const WithVisual: Story = {
	...Default,
	render: ( args ) => (
		<Stack gap="md" align="flex-start" justify="space-between">
			<Stack>
				<ControlledCheckboxControl { ...args } />
			</Stack>
			<Stack
				align="center"
				justify="center"
				style={ {
					backgroundColor:
						'var(--wpds-color-background-surface-neutral-weak)',
					borderRadius: 'var(--wpds-border-radius-md)',
					flexShrink: 0,
					height: 'var(--wpds-dimension-size-lg)',
					width: 'var(--wpds-dimension-size-lg)',
				} }
			>
				<Icon icon={ wordpress } />
			</Stack>
		</Stack>
	),
	args: {
		...Default.args,
		help: 'Additional context that helps users understand what this setting does and when they might want to turn it on or off.',
	},
};
