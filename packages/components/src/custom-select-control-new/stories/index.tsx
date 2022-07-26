/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
// import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	CustomSelectControl,
	CustomSelectControlItem,
	CustomSelectControlGroup,
	CustomSelectControlGroupLabel,
	CustomSelectControlSeparator,
} from '../';

const meta: ComponentMeta< typeof CustomSelectControl > = {
	component: CustomSelectControl,
	title: 'Components (Experimental)/CustomSelectControlNew',
	argTypes: {},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

// TODO:
// - with `options` prop
// - controlled vs uncontrolled
// - with HTML `<options />` (and related vanilla elements)?
// - example with custom author dropdown

export const Default: ComponentStory< typeof CustomSelectControl > = (
	args
) => (
	<CustomSelectControl { ...args }>
		<CustomSelectControlItem value="Venus" />
		<CustomSelectControlItem value="Earth">
			{ /* Custom item label */ }
			Planet Earth
		</CustomSelectControlItem>
		<CustomSelectControlItem value="Mars" />
		<CustomSelectControlItem value="Jupiter" disabled />
		<CustomSelectControlItem value="Neptune" />
	</CustomSelectControl>
);
Default.args = {
	label: 'Choose a planet',
};

export const WithGroupsAndSeparators: ComponentStory<
	typeof CustomSelectControl
> = ( args ) => {
	return (
		<CustomSelectControl { ...args }>
			{ [
				{ label: 'Primary', values: [ 'Red', 'Yellow', 'Blue' ] },
				{ label: 'Secondary', values: [ 'Orange', 'Green', 'Purple' ] },
				{
					label: 'Tertiary',
					values: [
						'Amber',
						'Vermilion',
						'Magenta',
						'Violet',
						'Teal',
						'Chartreuse',
					],
				},
			].map( ( { label, values }, groupIndex, groupArray ) => (
				<>
					<CustomSelectControlGroup>
						<CustomSelectControlGroupLabel>
							{ label }
						</CustomSelectControlGroupLabel>
						{ values.map( ( value, valueIndex ) => (
							<CustomSelectControlItem
								key={ value }
								value={ value }
								// Enables scroll on key down so pressing ArrowUp will scroll up and
								// reveals the group label.
								preventScrollOnKeyDown={
									groupIndex === 0 && valueIndex === 0
								}
							/>
						) ) }
					</CustomSelectControlGroup>
					{ groupIndex < groupArray.length - 1 ? (
						<CustomSelectControlSeparator />
					) : null }
				</>
			) ) }
		</CustomSelectControl>
	);
};
WithGroupsAndSeparators.args = {
	label: 'Pick a color',
};
