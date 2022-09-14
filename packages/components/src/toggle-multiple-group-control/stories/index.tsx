/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { formatBold, formatItalic, formatUnderline } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ToggleMultipleGroupControl } from '../';
import { ToggleMultipleGroupControlOptionIcon } from '../option-icon';

const meta: ComponentMeta< typeof ToggleMultipleGroupControl > = {
	component: ToggleMultipleGroupControl,
	title: 'Components (Experimental)/ToggleMultipleGroupControl',
	subcomponents: { ToggleMultipleGroupControlOptionIcon },
	argTypes: {
		help: { control: { type: 'text' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof ToggleMultipleGroupControl > = (
	props
) => {
	const [ bold, setBold ] = useState( false );
	const [ italic, setItalic ] = useState( false );
	const [ underline, setUndeline ] = useState( false );

	return (
		<ToggleMultipleGroupControl { ...props }>
			<ToggleMultipleGroupControlOptionIcon
				value="bold"
				label="Bold"
				icon={ formatBold }
				isPressed={ bold }
				onClick={ () => setBold( ! bold ) }
			/>
			<ToggleMultipleGroupControlOptionIcon
				value="italic"
				label="Italic"
				icon={ formatItalic }
				isPressed={ italic }
				onClick={ () => setItalic( ! italic ) }
			/>
			<ToggleMultipleGroupControlOptionIcon
				value="underline"
				label="Underline"
				icon={ formatUnderline }
				isPressed={ underline }
				onClick={ () => setUndeline( ! underline ) }
			/>
		</ToggleMultipleGroupControl>
	);
};

export const Default: ComponentStory< typeof ToggleMultipleGroupControl > =
	Template.bind( {} );
Default.args = {
	label: 'Label',
};
