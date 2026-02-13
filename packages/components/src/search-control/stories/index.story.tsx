/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SearchControl from '..';

const meta: Meta< typeof SearchControl > = {
	title: 'Components/Selection & Input/Common/SearchControl',
	id: 'components-searchcontrol',
	component: SearchControl,
	argTypes: {
		onChange: { action: 'onChange' },
		value: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'stable',
			whereUsed: 'global',
			notes: 'Will be superseded by `SearchControl` in `@wordpress/ui`, but continue using for now.',
		},
	},
};
export default meta;

const Template: StoryFn< typeof SearchControl > = ( {
	onChange,
	...props
} ) => {
	const [ value, setValue ] = useState< string >();

	return (
		<SearchControl
			{ ...props }
			value={ value }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange( ...changeArgs );
			} }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	help: 'Help text to explain the input.',
};
