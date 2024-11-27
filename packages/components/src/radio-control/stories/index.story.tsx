/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { starFilled } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RadioControl from '..';
import Icon from '../../icon';

const meta: Meta< typeof RadioControl > = {
	component: RadioControl,
	title: 'Components/Selection & Input/Common/RadioControl',
	id: 'components-radiocontrol',
	argTypes: {
		onChange: {
			action: 'onChange',
		},
		selected: {
			control: false,
		},
		label: {
			control: { type: 'text' },
		},
		help: {
			control: { type: 'text' },
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof RadioControl > = ( {
	onChange,
	options,
	...args
} ) => {
	const [ value, setValue ] = useState( options?.[ 0 ]?.value );

	return (
		<RadioControl
			{ ...args }
			selected={ value }
			options={ options }
			onChange={ ( v ) => {
				setValue( v );
				onChange( v );
			} }
		/>
	);
};

export const Default: StoryFn< typeof RadioControl > = Template.bind( {} );
Default.args = {
	label: 'Post visibility',
	options: [
		{ label: 'Public', value: 'public' },
		{ label: 'Private', value: 'private' },
		{ label: 'Password Protected', value: 'password' },
	],
};

export const WithOptionDescriptions: StoryFn< typeof RadioControl > =
	Template.bind( {} );
WithOptionDescriptions.args = {
	...Default.args,
	options: [
		{
			label: 'Public',
			value: 'public',
			description: 'Visible to everyone',
		},
		{
			label: 'Private',
			value: 'private',
			description: 'Only visible to you',
		},
		{
			label: 'Password Protected',
			value: 'password',
			description: 'Protected by a password',
		},
	],
};

/**
 * When the label is not a string,
 * make sure that the element is accessibly labeled.
 */
export const WithComponentLabels: StoryFn< typeof RadioControl > =
	Template.bind( {} );

function Rating( {
	stars,
	...restProps
}: { stars: number } & JSX.IntrinsicElements[ 'div' ] ) {
	return (
		<div style={ { display: 'flex' } } { ...restProps }>
			{ Array.from( { length: stars }, ( _, index ) => (
				<Icon key={ index } icon={ starFilled } />
			) ) }
		</div>
	);
}

WithComponentLabels.args = {
	label: 'Rating',
	options: [
		{
			label: <Rating stars={ 3 } aria-label="Three Stars" />,
			value: '3',
		},
		{
			label: <Rating stars={ 2 } aria-label="Two Stars" />,
			value: '2',
		},
		{
			label: <Rating stars={ 1 } aria-label="One Star" />,
			value: '1',
		},
	],
};
