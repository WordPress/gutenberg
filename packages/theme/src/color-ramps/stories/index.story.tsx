import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import { ThemeProvider } from '../../theme-provider';
import type {
	ThemeProviderColorRampName,
	ThemeProviderColorWarning,
} from '../../theme-provider-color-warnings';
import { ColorWarningDetails } from './color-warning-details';
import { hasColorWarningForRamp, RampTable } from './ramp-table';
import { buildBgRamp, buildAccentRamp } from '..';
import { DEFAULT_SEED_COLORS } from '../lib/constants';

const ColorGen = ( props: {
	background: string;
	primary: string;
	children: React.ReactNode;
} ) => {
	return <div>{ props.children }</div>;
};

const meta: Meta< typeof ColorGen > = {
	title: 'Design System/Theme/Theme Provider/Color Scales',
	component: ColorGen,
	argTypes: {
		background: {
			control: { type: 'color', presetColors: [ '#1e1e1e', '#f8f8f8' ] },
		},
		primary: {
			control: {
				type: 'color',
				presetColors: [ '#3858e9', '#069e08', '#873eff' ],
			},
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

type Combination = {
	label: string;
	source: string;
	background: string;
	primary: string;
};

type RampTableRamp = React.ComponentProps<
	typeof RampTable
>[ 'ramps' ][ number ];

function buildDisplayedRamps( {
	background,
	primary,
}: {
	background: string;
	primary: string;
} ): RampTableRamp[] {
	const bgRamp = buildBgRamp( background );
	const ramps: RampTableRamp[] = [
		{
			name: 'background',
			seed: {
				name: 'surface2',
				value: background,
			},
			ramp: bgRamp.ramp,
		},
	];
	const accentSeeds = [
		[ 'primary', primary ],
		[ 'info', DEFAULT_SEED_COLORS.info ],
		[ 'success', DEFAULT_SEED_COLORS.success ],
		[ 'warning', DEFAULT_SEED_COLORS.warning ],
		[ 'caution', DEFAULT_SEED_COLORS.caution ],
		[ 'error', DEFAULT_SEED_COLORS.error ],
	] as const satisfies readonly [ ThemeProviderColorRampName, string ][];

	for ( const [ name, value ] of accentSeeds ) {
		ramps.push( {
			name,
			seed: {
				name: 'bgFill1',
				value,
			},
			ramp: buildAccentRamp( value, bgRamp ).ramp,
		} );
	}

	return ramps;
}

function ColorScaleCombination( {
	label,
	source,
	background,
	primary,
	includeAllRamps = false,
}: Combination & { includeAllRamps?: boolean } ) {
	const headingId = useId();
	const [ warnings, setWarnings ] = useState<
		readonly ThemeProviderColorWarning[] | undefined
	>();
	const allRamps = buildDisplayedRamps( {
		background,
		primary,
	} );
	const ramps = includeAllRamps
		? allRamps
		: allRamps.filter(
				( ramp ) =>
					ramp.name === 'background' ||
					ramp.name === 'primary' ||
					hasColorWarningForRamp( warnings ?? [], ramp.name )
		  );

	return (
		<article
			aria-labelledby={ headingId }
			style={ {
				display: 'grid',
				gap: '1rem',
				padding: '1rem',
				border: '1px solid #dcdcde',
			} }
		>
			<ThemeProvider
				color={ { background, primary } }
				onColorWarnings={ setWarnings }
			/>
			<header>
				<h2 id={ headingId }>{ label }</h2>
				<p>
					Source: { source }. Primary seed: <code>{ primary }</code>.
					Background seed: <code>{ background }</code>.
				</p>
			</header>
			<RampTable ramps={ ramps } warnings={ warnings } />
			<ColorWarningDetails warnings={ warnings } />
		</article>
	);
}

export const Default: StoryObj< typeof ColorGen > = {
	render: ( args ) => {
		const background = args.background ?? DEFAULT_SEED_COLORS.background;
		const primary = args.primary ?? DEFAULT_SEED_COLORS.primary;

		return (
			<ColorScaleCombination
				key={ `${ primary }-${ background }` }
				label="Custom color scales"
				source="Storybook controls"
				background={ background }
				primary={ primary }
				includeAllRamps
			/>
		);
	},
	args: {
		background: DEFAULT_SEED_COLORS.background,
		primary: DEFAULT_SEED_COLORS.primary,
	},
};

const SAMPLE_COMBINATIONS = [
	{
		label: 'Default light',
		source: 'ThemeProvider defaults',
		background: '#fcfcfc',
		primary: '#3858e9',
	},
	{
		label: 'Tooltip dark',
		source: 'Tooltip and WordPress dark admin scheme',
		background: '#1e1e1e',
		primary: '#3858e9',
	},
	{
		label: 'Modern admin dark',
		source: 'WordPress admin',
		background: '#222524',
		primary: '#3858e9',
	},
	{
		label: '#81162 reproduction',
		source: 'GitHub issue #81162',
		background: '#4f386e',
		primary: '#608010',
	},
	{
		label: 'WordPress light',
		source: 'WordPress light admin scheme',
		background: '#f8f8f8',
		primary: '#3858e9',
	},
	{
		label: 'Fresh',
		source: 'WordPress admin scheme',
		background: '#25292b',
		primary: '#3858e9',
	},
	{
		label: 'Light',
		source: 'WordPress admin scheme',
		background: '#eaeeed',
		primary: '#007cba',
	},
	{
		label: 'Blue',
		source: 'WordPress admin scheme',
		background: '#3876a8',
		primary: '#437aa8',
	},
	{
		label: 'Coffee',
		source: 'WordPress admin scheme',
		background: '#5b534d',
		primary: '#916745',
	},
	{
		label: 'Ectoplasm',
		source: 'WordPress admin scheme',
		background: '#4f386e',
		primary: '#646c3e',
	},
	{
		label: 'Ocean',
		source: 'WordPress admin scheme',
		background: '#5f787f',
		primary: '#567958',
	},
	{
		label: 'Midnight',
		source: 'WordPress admin scheme',
		background: '#3d4042',
		primary: '#cf4339',
	},
	{
		label: 'Sunrise',
		source: 'WordPress admin scheme',
		background: '#cc4541',
		primary: '#ad631e',
	},
] as const satisfies readonly Combination[];

export const SampleCombinations: StoryObj< typeof ColorGen > = {
	render: () => (
		<div
			style={ {
				display: 'grid',
				gap: '1rem',
			} }
		>
			{ SAMPLE_COMBINATIONS.map( ( combination ) => (
				<ColorScaleCombination
					key={ combination.label }
					{ ...combination }
				/>
			) ) }
		</div>
	),
	argTypes: {
		background: {
			control: false,
		},
		primary: {
			control: false,
		},
	},
};
