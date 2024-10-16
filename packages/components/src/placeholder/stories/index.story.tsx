/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { starEmpty, starFilled, styles, wordpress } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Placeholder from '../';
import TextControl from '../../text-control';

const ICONS = { starEmpty, starFilled, styles, wordpress };

const meta: Meta< typeof Placeholder > = {
	component: Placeholder,
	title: 'Components/Placeholder',
	argTypes: {
		children: { control: { type: null } },
		notices: { control: { type: null } },
		preview: { control: { type: null } },
		icon: {
			control: { type: 'select' },
			options: Object.keys( ICONS ),
			mapping: ICONS,
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Placeholder > = ( args ) => {
	const [ value, setValue ] = useState( '' );

	return (
		<Placeholder { ...args }>
			<div>
				<TextControl
					__nextHasNoMarginBottom
					label="Sample Field"
					placeholder="Enter something here"
					value={ value }
					onChange={ setValue }
				/>
			</div>
		</Placeholder>
	);
};

export const Default: StoryFn< typeof Placeholder > = Template.bind( {} );
Default.args = {
	icon: 'wordpress',
	label: 'My Placeholder Label',
	instructions: 'Here are instructions you should follow',
};
