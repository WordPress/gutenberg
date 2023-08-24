/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import Theme from '../index';
import {
	Button,
	__experimentalInputControl as InputControl,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
} from '../..';
import Popover from '../../popover';
import { DropdownDemo } from '../../dropdown-menu-v2/stories/index.story';
import { DropdownMenu } from '../../dropdown-menu-v2';
import { Provider as SlotFillProvider } from '../../slot-fill';
import { generateThemeVariables, checkContrasts } from '../color-algorithms';
import { HStack } from '../../h-stack';

const meta: Meta< typeof Theme > = {
	component: Theme,
	title: 'Components (Experimental)/Theme',
	argTypes: {
		accent: { control: { type: 'color' } },
		background: { control: { type: 'color' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Theme > = ( args ) => (
	<Theme { ...args }>
		<Button variant="primary">Hello</Button>
	</Theme>
);

export const Default = Template.bind( {} );
Default.args = {};

export const Nested: StoryFn< typeof Theme > = ( args ) => (
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

// Demo
export const Demo: StoryFn< typeof Theme > = ( args ) => {
	console.log( 'dark:', args.isDark );
	return (
		<Theme accent={ args.accent } isDark={ args.isDark }>
			<VStack
				alignment="topLeft"
				spacing={ 5 }
				style={ {
					padding: 32,
					minHeight: '100vh',
					backgroundColor:
						'var(--wp-components-color-gray-background)',
				} }
			>
				<Heading>My first heading</Heading>
				<Text>
					Lorem Ipsum is simply dummy text of the printing and
					typesetting industry. Lorem Ipsum has been the industry's
					standard dummy text ever since the 1500s, when an unknown
					printer took a galley of type and scrambled it to make a
					type specimen book.
				</Text>
				<Heading as="h2" level={ 3 }>
					Two
				</Heading>
				<Text>
					Lorem Ipsum is simply dummy text of the printing and
					typesetting industry.
				</Text>

				<InputControl
					label="Input"
					value={ 'Input' }
					help="This is some help text"
					onChange={ ( value ) => console.log( value ) }
				/>
				<HStack alignment="left">
					<SlotFillProvider>
						<DropdownMenu
							align="start"
							side="bottom"
							sideOffset={ 8 }
							trigger={
								<Button
									variant="primary"
									__next40pxDefaultSize
									label="Open menu"
								>
									Open menu
								</Button>
							}
						>
							<DropdownDemo />
						</DropdownMenu>
						{ /* @ts-expect-error Slot is not currently typed on Popover */ }
						<Popover.Slot />
					</SlotFillProvider>
					<Button __next40pxDefaultSize variant="secondary">
						Secondary
					</Button>
				</HStack>
				<ToggleControl
					checked
					label="This is a toggle"
					onChange={ () => console.log( 'yay' ) }
				/>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					label="Label"
					onChange={ () => {} }
				>
					<ToggleGroupControlOption label="Left" value="left" />
					<ToggleGroupControlOption label="Center" value="center" />
					<ToggleGroupControlOption label="Right" value="right" />
					<ToggleGroupControlOption label="Justify" value="justify" />
				</ToggleGroupControl>
			</VStack>
		</Theme>
	);
};
Nested.args = {
	isDark: false,
	accent: '#3858E9',
};

/**
 * The rest of the required colors are generated based on the given accent and background colors.
 */
export const ColorScheme: StoryFn< typeof Theme > = ( {
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
	accent: '#3858e9',
	background: '#fff',
};
ColorScheme.argTypes = {
	children: { table: { disable: true } },
};
ColorScheme.parameters = {
	docs: { canvas: { sourceState: 'hidden' } },
};
