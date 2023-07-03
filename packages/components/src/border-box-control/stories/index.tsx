/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import type { ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Popover from '../../popover';
import { BorderBoxControl } from '../';
import { Provider as SlotFillProvider } from '../../slot-fill';

const meta: ComponentMeta< typeof BorderBoxControl > = {
	title: 'Components (Experimental)/BorderBoxControl',
	component: BorderBoxControl,
	argTypes: {
		onChange: { action: 'onChange' },
		value: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

// Available border colors.
const colors = [
	{ name: 'Blue 20', color: '#72aee6' },
	{ name: 'Blue 40', color: '#3582c4' },
	{ name: 'Red 40', color: '#e65054' },
	{ name: 'Red 70', color: '#8a2424' },
	{ name: 'Yellow 10', color: '#f2d675' },
	{ name: 'Yellow 40', color: '#bd8600' },
];

const Template: ComponentStory< typeof BorderBoxControl > = ( props ) => {
	const { onChange, ...otherProps } = props;
	const [ borders, setBorders ] = useState< ( typeof props )[ 'value' ] >();

	const onChangeMerged: ComponentProps<
		typeof BorderBoxControl
	>[ 'onChange' ] = ( newBorders ) => {
		setBorders( newBorders );
		onChange( newBorders );
	};

	return (
		<SlotFillProvider>
			<BorderBoxControl
				{ ...otherProps }
				onChange={ onChangeMerged }
				value={ borders }
			/>
			<hr
				style={ {
					marginTop: '100px',
					borderColor: '#ddd',
					borderStyle: 'solid',
					borderBottom: 'none',
				} }
			/>
			<p style={ { color: '#aaa', fontSize: '0.9em' } }>
				The BorderBoxControl is intended to be used within a component
				that will provide reset controls. The button below is only for
				convenience.
			</p>
			<Button
				variant="primary"
				onClick={ () => onChangeMerged( undefined ) }
			>
				Reset
			</Button>
			{ /* @ts-expect-error Ignore until Popover.Slot is converted to TS */ }
			<Popover.Slot />
		</SlotFillProvider>
	);
};
export const Default = Template.bind( {} );
Default.args = {
	colors,
	label: 'Borders',
};
