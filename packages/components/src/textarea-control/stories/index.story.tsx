import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import TextareaControl from '..';

const meta: Meta< typeof TextareaControl > = {
	component: TextareaControl,
	title: 'Components/Selection & Input/Common/TextareaControl',
	id: 'components-textareacontrol',
	argTypes: {
		onChange: { action: 'onChange' },
		label: { control: { type: 'text' } },
		help: { control: { type: 'text' } },
		disabled: {
			control: { type: 'boolean' },
		},
		value: { control: false },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use [`TextareaControl`](?path=/docs/design-system-components-form-textareacontrol--docs) from `@wordpress/ui` instead. See the [migration guide](?path=/docs/components-textareacontrol--migration-guide).',
		},
	},
};
export default meta;

const Template: StoryFn< typeof TextareaControl > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] = useState( '' );

	return (
		<TextareaControl
			{ ...args }
			value={ value }
			onChange={ ( v ) => {
				setValue( v );
				onChange( v );
			} }
		/>
	);
};

export const Default: StoryFn< typeof TextareaControl > = Template.bind( {} );
Default.args = {
	label: 'Text',
	help: 'Enter some text',
	placeholder: 'Placeholder',
};
