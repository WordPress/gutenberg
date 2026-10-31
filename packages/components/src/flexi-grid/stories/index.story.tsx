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
import FlexiGrid from '..';
import RangeControl from '../../range-control';

const meta: Meta< typeof FlexiGrid > = {
	title: 'Components (Experimental)/FlexiGrid',
	component: FlexiGrid,
	decorators: [
		( Story ) => {
			const defaultWidth = 50;
			const [ width, setWidth ] = useState( defaultWidth );
			return (
				<>
					<div style={ { width: `${ width }%` } }>
						<Story />
					</div>
					<RangeControl
						withInputField={ false }
						showTooltip={ false }
						value={ width }
						onChange={ ( value ) =>
							setWidth( value || defaultWidth )
						}
					/>
				</>
			);
		},
	],
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'FlexiGrid.Cell': FlexiGrid.Cell,
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof FlexiGrid > = ( { minCellWidth = '10em' } ) => (
	<FlexiGrid minCellWidth={ minCellWidth } gap={ '1em' }>
		<FlexiGrid.Cell>Cell 1</FlexiGrid.Cell>
		<FlexiGrid.Cell>Cell 2</FlexiGrid.Cell>
		<FlexiGrid.Cell>Cell 3</FlexiGrid.Cell>
		<FlexiGrid.Cell>Cell 4</FlexiGrid.Cell>
		<FlexiGrid.Cell>Cell 5</FlexiGrid.Cell>
		<FlexiGrid.Cell>Cell 6</FlexiGrid.Cell>
	</FlexiGrid>
);

export const Default = Template.bind( {} );
