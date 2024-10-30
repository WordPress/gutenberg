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
import RadioControl from '..';
import { Path, SVG } from '@wordpress/primitives';

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

export const WithComponentLabels: StoryFn< typeof RadioControl > =
	Template.bind( {} );

function Rating( { stars, ariaLabel }: { stars: number; ariaLabel: string } ) {
	const starPath =
		'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
	return (
		<div
			style={ { display: 'flex' } }
			aria-label={ ariaLabel }
			title={ ariaLabel }
		>
			{ Array.from( { length: stars }, ( _, index ) => (
				<SVG
					key={ index }
					width={ 24 }
					height={ 24 }
					viewBox="0 0 24 24"
				>
					<Path d={ starPath } />
				</SVG>
			) ) }
		</div>
	);
}

WithComponentLabels.args = {
	label: 'Rating',
	options: [
		{
			label: <Rating stars={ 5 } ariaLabel="Five Stars" />,
			value: '5',
		},
		{
			label: <Rating stars={ 4 } ariaLabel="Four Stars" />,
			value: '4',
		},
		{
			label: <Rating stars={ 3 } ariaLabel="Three Stars" />,
			value: '3',
		},
		{
			label: <Rating stars={ 2 } ariaLabel="Two Stars" />,
			value: '2',
		},
		{
			label: <Rating stars={ 1 } ariaLabel="One Star" />,
			value: '1',
		},
	],
};
