import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { ThemeProvider } from '../theme-provider';
import { getElevationOpacity, getHighlightOpacity } from '../elevation';

const LEVELS = [
	{ token: '--wpds-elevation-xs', usage: 'Switch thumb' },
	{ token: '--wpds-elevation-sm', usage: 'Tooltip' },
	{ token: '--wpds-elevation-md', usage: 'Popover, menu', stroke: true },
	{ token: '--wpds-elevation-lg', usage: 'Dialog, drawer' },
];

type Strokes = 'as used' | 'none' | 'all';

type Args = { background: string; strokes: Strokes };

const text: CSSProperties = {
	color: 'var(--wpds-color-foreground-content-neutral)',
	fontFamily: 'var(--wpds-typography-font-family-body)',
	fontSize: 'var(--wpds-typography-font-size-sm)',
};

const weakText: CSSProperties = {
	...text,
	color: 'var(--wpds-color-foreground-content-neutral-weak)',
};

const Levels = ( {
	title,
	strokes,
}: {
	title: ReactNode;
	strokes: Strokes;
} ) => (
	<div
		style={ {
			backgroundColor: 'var(--wpds-color-background-surface-neutral)',
			padding: '2rem',
			display: 'flex',
			flexDirection: 'column',
			gap: '1rem',
		} }
	>
		<h3 style={ { ...text, margin: 0 } }>{ title }</h3>
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
				gap: '2rem',
			} }
		>
			{ LEVELS.map( ( { token, usage, stroke } ) => (
				<div
					key={ token }
					style={ {
						...text,
						backgroundColor:
							'var(--wpds-color-background-surface-neutral-strong)',
						borderRadius: 'var(--wpds-border-radius-md)',
						border: (
							strokes === 'as used' ? stroke : strokes === 'all'
						)
							? 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral)'
							: undefined,
						boxShadow: `var(${ token })`,
						padding: '1rem',
						minHeight: 72,
						display: 'flex',
						flexDirection: 'column',
						gap: '0.25rem',
					} }
				>
					<code>{ token }</code>
					<span style={ weakText }>{ usage }</span>
				</div>
			) ) }
		</div>
	</div>
);

const describeSeed = ( background: string ) =>
	`${ background } · shadow opacity ${ (
		getElevationOpacity( background ) * 100
	).toFixed( 1 ) }% · highlight opacity ${ (
		getHighlightOpacity( background ) * 100
	).toFixed( 1 ) }%`;

const meta: Meta< Args > = {
	title: 'Design System/Theme/Elevation',
	args: {
		background: '#fcfcfc',
		strokes: 'as used',
	},
	argTypes: {
		background: { control: 'color' },
		strokes: {
			control: 'inline-radio',
			options: [ 'as used', 'none', 'all' ],
			description:
				'Which cards get a stroke. "as used" matches the components: only popovers and menus have one.',
		},
	},
	parameters: {
		controls: { expanded: true },
	},
};
export default meta;

/**
 * The `--wpds-elevation-*` tokens are two black shadows per level, plus a
 * 1px inset white highlight along the top edge. Their opacity follows the
 * `ThemeProvider` background seed, increasing as the background gets darker
 * so elevated surfaces stay distinct in dark themes.
 */
export const Default: StoryObj< Args > = {
	render: ( { background, strokes } ) => (
		<ThemeProvider color={ { background } }>
			<Levels title={ describeSeed( background ) } strokes={ strokes } />
		</ThemeProvider>
	),
};

const SWEEP = [
	'#ffffff',
	'#f0f0f0',
	'#d0d0d0',
	'#777777',
	'#3a3a3a',
	'#1e1e1e',
	'#000000',
];

/**
 * The same levels across a range of background seeds, from white to black.
 */
export const BackgroundSweep: StoryObj< Args > = {
	argTypes: {
		background: { control: false },
	},
	render: ( { strokes } ) => (
		<>
			{ SWEEP.map( ( background ) => (
				<ThemeProvider key={ background } color={ { background } }>
					<Levels
						title={ describeSeed( background ) }
						strokes={ strokes }
					/>
				</ThemeProvider>
			) ) }
		</>
	),
};
