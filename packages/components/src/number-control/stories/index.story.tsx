import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import NumberControl from '..';

const meta: Meta< typeof NumberControl > = {
	title: 'Components/Selection & Input/Common/NumberControl',
	id: 'components-numbercontrol',
	component: NumberControl,
	argTypes: {
		onChange: { action: 'onChange' },
		prefix: { control: { type: 'text' } },
		step: { control: { type: 'text' } },
		suffix: { control: { type: 'text' } },
		type: { control: { type: 'text' } },
		value: { control: false },
	},
	tags: [ 'status-experimental' ],
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'For new use cases, use [`InputControl`](?path=/docs/design-system-components-form-inputcontrol--docs) with `type="number"` from `@wordpress/ui` instead. Existing usages should migrate with caution, due to significant differences in behavior. See the [migration guide](?path=/docs/components-inputcontrol--migration-guide).',
		},
	},
};

export default meta;

const Template: StoryFn< typeof NumberControl > = ( {
	onChange,
	...props
} ) => {
	const [ value, setValue ] = useState< string | undefined >( '0' );
	const [ isValidValue, setIsValidValue ] = useState( true );

	return (
		<>
			<NumberControl
				{ ...props }
				value={ value }
				onChange={ ( v, extra ) => {
					setValue( v );
					setIsValidValue(
						( extra.event.target as HTMLInputElement ).validity
							.valid
					);
					onChange?.( v, extra );
				} }
			/>
			<p>Is valid? { isValidValue ? 'Yes' : 'No' }</p>
		</>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	label: 'Value',
};
