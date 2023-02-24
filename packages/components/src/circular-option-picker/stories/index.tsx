// @ts-nocheck
/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, check } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CircularOptionPicker from '..';

const meta: ComponentMeta< typeof CircularOptionPicker > = {
	component: CircularOptionPicker,
	title: 'Components/CircularOptionPicker',
	argTypes: {},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof CircularOptionPicker > = ( {
	onChange,
	...args
} ) => {
	const [ currentColor, setCurrentColor ] = useState();
	const colors = [ ...args.colors ];
	const colorOptions = (
		<>
			{ colors.map( ( { color, name }, index ) => {
				return (
					<CircularOptionPicker.Option
						key={ `${ color }-${ index }` }
						tooltipText={ name }
						style={ { backgroundColor: color, color } }
						isSelected={ index === currentColor }
						onClick={ () => setCurrentColor( index ) }
						aria-label={ name }
					/>
				);
			} ) }
		</>
	);
	return (
		<CircularOptionPicker
			{ ...args }
			options={ colorOptions }
			actions={
				<CircularOptionPicker.ButtonAction
					onClick={ () => setCurrentColor( undefined ) }
				>
					{ 'Clear' }
				</CircularOptionPicker.ButtonAction>
			}
		/>
	);
};

export const Default: ComponentStory< typeof CircularOptionPicker > =
	DefaultTemplate.bind( {} );

Default.args = {
	colors: [
		{ color: '#f00', name: 'Red' },
		{ color: '#0f0', name: 'Green' },
		{ color: '#00f', name: 'Blue' },
	],
};
