/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Theme from '../index';
import Button from '../../button';
import { generateThemeVariables, checkContrasts } from '../color-algorithms';
import { HStack } from '../../h-stack';

const meta: ComponentMeta< typeof Theme > = {
	component: Theme,
	title: 'Components (Experimental)/Theme',
	argTypes: {
		accent: { control: { type: 'color' } },
		background: { control: { type: 'color' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Theme > = ( args ) => (
	<Theme { ...args }>
		<Button variant="primary">Hello</Button>
	</Theme>
);

export const Default = Template.bind( {} );
Default.args = {};

export const Nested: ComponentStory< typeof Theme > = ( args ) => (
	<Theme accent="tomato">
		<Button variant="primary">Outer theme (hardcoded)</Button>

		<Theme { ...args }>
			<Button variant="primary">
				Inner theme (set via Storybook controls)
			</Button>
		</Theme>
	</Theme>
);
Nested.args = {
	accent: 'blue',
};

/**
 * The rest of the required colors are generated based on the given accent and background colors.
 */
export const ColorScheme: ComponentStory< typeof Theme > = ( {
	accent,
	background,
} ) => {
	const { colors } = generateThemeVariables( { accent, background } );
	const { gray, ...otherColors } = colors;
	const contrastIssues = Object.entries(
		checkContrasts( { accent, background }, colors )
	).filter( ( [ _, error ] ) => !! error );

	const Chip = ( { color, name }: { color: string; name: string } ) => (
		<HStack justify="flex-start">
			<div
				style={ {
					backgroundColor: color,
					height: '1.25em',
					width: 40,
				} }
			/>
			<div style={ { fontSize: 14 } }>{ name }</div>
		</HStack>
	);

	return (
		<>
			{ Object.entries( otherColors ).map( ( [ key, value ] ) => (
				<Chip color={ value } name={ key } key={ key } />
			) ) }
			{ Object.entries( gray as NonNullable< typeof gray > ).map(
				( [ key, value ] ) => (
					<Chip
						color={ value }
						name={ `gray ${ key }` }
						key={ key }
					/>
				)
			) }
			{ !! contrastIssues.length && (
				<>
					<h2>Contrast issues</h2>
					<ul>
						{ contrastIssues.map( ( [ key, error ] ) => (
							<li key={ key }>{ error }</li>
						) ) }
					</ul>
				</>
			) }
		</>
	);
};
ColorScheme.args = {
	accent: '#007cba',
	background: '#fff',
};
ColorScheme.argTypes = {
	children: { table: { disable: true } },
};
ColorScheme.parameters = {
	docs: { source: { state: 'closed' } },
};
