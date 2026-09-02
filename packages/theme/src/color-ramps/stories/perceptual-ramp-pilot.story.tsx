import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from '@wordpress/element';
import { contrastAPCA, deltaEOK2, get, OKLCH } from 'colorjs.io/fn';
import { checkAccessibleCombinations } from '..';
import { getContrast } from '../lib/color-utils';
import { DEFAULT_SEED_COLORS } from '../lib/constants';
import type { Ramp, RampResult } from '../lib/types';
import {
	EXPERIMENTAL_RAMP_METHODS,
	buildExperimentalThemeRamps,
	getExperimentalChroma,
	type ExperimentalThemeRamps,
} from './perceptual-ramp-experiment';
import styles from './perceptual-ramp-pilot.module.css';
import {
	TRUNK_PRODUCTION_COMMIT,
	getTrunkProductionThemeRamps,
} from './trunk-production-fixtures';

const COMPARISON_RAMP_METHODS = [
	'trunk-production',
	...EXPERIMENTAL_RAMP_METHODS,
] as const;

type ComparisonRampMethod = ( typeof COMPARISON_RAMP_METHODS )[ number ];

const SAMPLE_COMBINATIONS = [
	{
		label: 'Default light',
		background: DEFAULT_SEED_COLORS.background,
		primary: DEFAULT_SEED_COLORS.primary,
	},
	{
		label: 'Default dark',
		background: '#1e1e1e',
		primary: DEFAULT_SEED_COLORS.primary,
	},
	{
		label: 'Ectoplasm stress case',
		background: '#413256',
		primary: '#a3b745',
	},
	{
		label: 'Blue admin scheme',
		background: '#3876a8',
		primary: '#437aa8',
	},
	{
		label: 'Ocean admin scheme',
		background: '#5f787f',
		primary: '#567958',
	},
	{
		label: 'Sunrise admin scheme',
		background: '#cc4541',
		primary: '#ad631e',
	},
	{
		label: 'Middle-gray polarity boundary',
		background: '#777777',
		primary: '#d63638',
	},
	{
		label: 'Yellow gamut edge',
		background: '#fcfcfc',
		primary: '#ffd700',
	},
	{
		label: 'Cyan gamut edge',
		background: '#1e1e1e',
		primary: '#00ffff',
	},
] as const;

const METHOD_DETAILS: Record<
	ComparisonRampMethod,
	{ label: string; description: string }
> = {
	'trunk-production': {
		label: 'Trunk production',
		description: `Exact fixed-sample output from trunk at ${ TRUNK_PRODUCTION_COMMIT.slice(
			0,
			11
		) }. Trunk has four foreground steps.`,
	},
	anchored: {
		label: 'Current production candidate',
		description:
			'Current draft algorithm. APCA shapes the five foreground steps and WCAG ratios shape the other lanes.',
	},
	'constrained-perceptual': {
		label: 'Constrained perceptual surfaces and strokes',
		description:
			'Uses Oklr lightness and OKLab color difference to space surfaces and strokes while retaining the production chroma policy and WCAG gates.',
	},
	'apca-all': {
		label: 'APCA for every lane',
		description:
			'Uses APCA as the spacing coordinate for surfaces, strokes, fills, and foregrounds. WCAG remains a hard gate.',
	},
	'role-hybrid': {
		label: 'Role-specific hybrid',
		description:
			'Uses APCA for foreground readability, OKLab color difference for surfaces and states, and relative chroma for accents.',
	},
	'pinned-role-hybrid': {
		label: 'Pinned-seed role hybrid',
		description:
			'Pins the supplied color at its semantic anchor, then redirects neighboring surfaces and fills when the original polarity has no contrast headroom.',
	},
};

const RAMP_STEPS = [
	{ name: 'surface1', label: 'SF1', group: 'Surfaces' },
	{ name: 'surface2', label: 'SF2', group: 'Surfaces' },
	{ name: 'surface3', label: 'SF3', group: 'Surfaces' },
	{ name: 'surface4', label: 'SF4', group: 'Surfaces' },
	{ name: 'surface5', label: 'SF5', group: 'Surfaces' },
	{ name: 'surface6', label: 'SF6', group: 'Surfaces' },
	{ name: 'bgFill1', label: 'BGF1', group: 'Fills' },
	{ name: 'bgFill2', label: 'BGF2', group: 'Fills' },
	{ name: 'fgFill', label: 'FGF', group: 'Fills' },
	{ name: 'stroke1', label: 'ST1', group: 'Strokes' },
	{ name: 'stroke2', label: 'ST2', group: 'Strokes' },
	{ name: 'stroke3', label: 'ST3', group: 'Strokes' },
	{ name: 'stroke4', label: 'ST4', group: 'Strokes' },
	{ name: 'fgSurface1', label: 'FGS1', group: 'Foregrounds' },
	{ name: 'fgSurface2', label: 'FGS2', group: 'Foregrounds' },
	{ name: 'fgSurface3', label: 'FGS3', group: 'Foregrounds' },
	{ name: 'fgSurface4', label: 'FGS4', group: 'Foregrounds' },
	{ name: 'fgSurface5', label: 'FGS5', group: 'Foregrounds' },
] as const satisfies readonly {
	name: keyof Ramp;
	label: string;
	group: string;
}[];

const SCALE_DETAILS = [
	{ name: 'background', label: 'Neutral', seed: 'background' },
	{ name: 'primary', label: 'Brand', seed: 'primary' },
	{ name: 'error', label: 'Error', seed: 'error' },
] as const;

type PilotArgs = {
	approaches: ComparisonRampMethod[];
};

const meta = {
	title: 'Design System/Theme/Theme Provider/Perceptual Ramp Pilot',
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'hidden' } },
	},
	argTypes: {
		approaches: {
			control: {
				type: 'inline-check',
				labels: Object.fromEntries(
					COMPARISON_RAMP_METHODS.map( ( method ) => [
						method,
						METHOD_DETAILS[ method ].label,
					] )
				),
			},
			description: 'Approaches shown in each comparison table.',
			options: COMPARISON_RAMP_METHODS,
		},
	},
} satisfies Meta< PilotArgs >;

export default meta;

type Story = StoryObj< PilotArgs >;
type ScaleName = ( typeof SCALE_DETAILS )[ number ][ 'name' ];

const rampCache = new Map< string, ExperimentalThemeRamps >();

function getRamps(
	method: ComparisonRampMethod,
	background: string,
	primary: string
) {
	const key = `${ method }|${ background }|${ primary }`;
	const cached = rampCache.get( key );
	if ( cached ) {
		return cached;
	}

	const ramps =
		method === 'trunk-production'
			? getTrunkProductionThemeRamps( background, primary )
			: buildExperimentalThemeRamps( {
					method,
					background,
					primary,
					error: DEFAULT_SEED_COLORS.error,
			  } );
	rampCache.set( key, ramps );
	return ramps;
}

function getSwatchTextColor( color: string ) {
	return getContrast( color, '#000' ) >= getContrast( color, '#fff' )
		? '#000'
		: '#fff';
}

function getCrossRampFailures( ramp: RampResult, backgroundRamp: RampResult ) {
	let failures = 0;
	for ( const surface of [ 'surface1', 'surface2', 'surface3' ] as const ) {
		for ( const foreground of [
			'fgSurface3',
			'fgSurface4',
			'fgSurface5',
		] as const ) {
			if (
				getContrast(
					backgroundRamp.ramp[ surface ],
					ramp.ramp[ foreground ]
				) < 4.5
			) {
				failures++;
			}
		}
		if (
			getContrast( backgroundRamp.ramp[ surface ], ramp.ramp.stroke3 ) < 3
		) {
			failures++;
		}
	}
	return failures;
}

function getScaleMetrics(
	ramp: RampResult,
	backgroundRamp: RampResult,
	isAccent: boolean,
	seed: string
) {
	const anchor = isAccent ? ramp.ramp.bgFill1 : ramp.ramp.surface2;
	const displayBackground = backgroundRamp.ramp.surface2;
	const currentForegroundContrast = Math.abs(
		contrastAPCA( displayBackground, ramp.ramp.fgSurface4 )
	);
	const activeForegroundContrast = Math.abs(
		contrastAPCA( displayBackground, ramp.ramp.fgSurface5 )
	);
	const failures =
		checkAccessibleCombinations( { bgRamp: ramp } ).length +
		( isAccent ? getCrossRampFailures( ramp, backgroundRamp ) : 0 );
	const seedChroma = getExperimentalChroma( seed );
	const chromaDrift = isAccent
		? [ 'surface4', 'surface5', 'stroke2', 'stroke3' ].reduce(
				( total, step ) =>
					total +
					Math.abs(
						getExperimentalChroma(
							ramp.ramp[ step as keyof Ramp ]
						) - seedChroma
					),
				0
		  ) / 4
		: undefined;

	return {
		failures,
		anchorDifference: deltaEOK2( seed, anchor ),
		anchorLightnessShift:
			get( anchor, [ OKLCH, 'l' ] ) - get( seed, [ OKLCH, 'l' ] ),
		fillDifference: deltaEOK2( ramp.ramp.bgFill1, ramp.ramp.bgFill2 ),
		foregroundDifference: deltaEOK2(
			ramp.ramp.fgSurface4,
			ramp.ramp.fgSurface5
		),
		foregroundApcaInterval:
			activeForegroundContrast - currentForegroundContrast,
		chromaDrift,
	};
}

function Seed( { label, color }: { label: string; color: string } ) {
	return (
		<span className={ styles.seed }>
			<span
				aria-hidden="true"
				className={ styles[ 'seed-swatch' ] }
				style={ { background: color } }
			/>
			{ label } <code>{ color }</code>
		</span>
	);
}

function MethodSummary( {
	method,
	ramp,
	backgroundRamp,
	isAccent,
	seed,
}: {
	method: ComparisonRampMethod;
	ramp: RampResult;
	backgroundRamp: RampResult;
	isAccent: boolean;
	seed: string;
} ) {
	const metrics = getScaleMetrics( ramp, backgroundRamp, isAccent, seed );

	return (
		<div className={ styles[ 'method-summary' ] }>
			<strong>{ METHOD_DETAILS[ method ].label }</strong>
			<span
				className={ styles.status }
				data-pass={ metrics.failures === 0 }
			>
				{ metrics.failures === 0
					? 'WCAG gates pass'
					: `${ metrics.failures } WCAG failures` }
			</span>
			<span
				className={ styles[ 'anchor-status' ] }
				data-preserved={ metrics.anchorDifference <= 0.002 }
			>
				{ metrics.anchorDifference <= 0.002
					? 'Seed preserved'
					: `Seed moved ΔE ${ metrics.anchorDifference.toFixed(
							3
					  ) }` }
			</span>
			<span>Anchor ΔL { metrics.anchorLightnessShift.toFixed( 3 ) }</span>
			<span>
				Foreground polarity:{ ' ' }
				{ ramp.direction === 'lighter' ? 'light' : 'dark' }
			</span>
			<span>Fill ΔE { metrics.fillDifference.toFixed( 3 ) }</span>
			{ method === 'trunk-production' ? (
				<span>FGS5 not present on trunk</span>
			) : (
				<>
					<span>
						FGS4→5 ΔE { metrics.foregroundDifference.toFixed( 3 ) }
					</span>
					<span>
						FGS4→5 ΔLc{ ' ' }
						{ metrics.foregroundApcaInterval.toFixed( 1 ) }
					</span>
				</>
			) }
			{ metrics.chromaDrift === undefined ? null : (
				<span>
					Mean relative chroma drift{ ' ' }
					{ metrics.chromaDrift.toFixed( 3 ) }
				</span>
			) }
		</div>
	);
}

function ScaleTable( {
	label,
	seed,
	scaleName,
	methods,
	rampsByMethod,
}: {
	label: string;
	seed: string;
	scaleName: ScaleName;
	methods: ComparisonRampMethod[];
	rampsByMethod: Map< ComparisonRampMethod, ExperimentalThemeRamps >;
} ) {
	const groups = Array.from(
		new Set( RAMP_STEPS.map( ( step ) => step.group ) )
	);
	const scrollContainer = useRef< HTMLDivElement >( null );
	const scrollTable = ( direction: -1 | 1 ) => {
		const container = scrollContainer.current;
		if ( ! container ) {
			return;
		}
		container.scrollBy( {
			behavior: 'auto',
			left: direction * container.clientWidth * 0.75,
		} );
	};

	return (
		<section className={ styles[ 'scale-section' ] }>
			<header className={ styles[ 'scale-heading' ] }>
				<h3>{ label }</h3>
				<Seed label="Seed" color={ seed } />
			</header>
			<div
				aria-label={ `${ label } ramp table navigation` }
				className={ styles[ 'table-navigation' ] }
				role="group"
			>
				<button onClick={ () => scrollTable( -1 ) } type="button">
					Previous steps
				</button>
				<button onClick={ () => scrollTable( 1 ) } type="button">
					Next steps
				</button>
			</div>
			<div
				aria-label={ `${ label } ramp comparison` }
				className={ styles[ 'table-scroll' ] }
				ref={ scrollContainer }
				role="region"
			>
				<table className={ styles[ 'scale-table' ] }>
					<thead>
						<tr>
							<th rowSpan={ 2 } scope="col">
								Approach
							</th>
							{ groups.map( ( group ) => (
								<th
									colSpan={
										RAMP_STEPS.filter(
											( step ) => step.group === group
										).length
									}
									key={ group }
									scope="colgroup"
								>
									{ group }
								</th>
							) ) }
						</tr>
						<tr>
							{ RAMP_STEPS.map( ( step ) => (
								<th key={ step.name } scope="col">
									{ step.label }
								</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ methods.map( ( method ) => {
							const methodRamps = rampsByMethod.get( method )!;
							const ramp = methodRamps[ scaleName ];
							const anchorStep =
								scaleName === 'background'
									? 'surface2'
									: 'bgFill1';
							return (
								<tr key={ method }>
									<th scope="row">
										<MethodSummary
											backgroundRamp={
												methodRamps.background
											}
											isAccent={
												scaleName !== 'background'
											}
											method={ method }
											ramp={ ramp }
											seed={ seed }
										/>
									</th>
									{ RAMP_STEPS.map( ( step ) => {
										const color = ramp.ramp[ step.name ];
										const unavailableOnTrunk =
											method === 'trunk-production' &&
											step.name === 'fgSurface5';
										return (
											<td
												key={ step.name }
												style={ {
													background: color,
													color: getSwatchTextColor(
														color
													),
												} }
												title={ `${ step.name }: ${ color }` }
											>
												{ unavailableOnTrunk ? (
													<span
														className={
															styles[
																'unavailable-step'
															]
														}
													>
														Not on trunk
													</span>
												) : null }
												{ step.name === anchorStep ? (
													<span
														className={
															styles[
																'seed-anchor'
															]
														}
														style={ {
															background: seed,
															color: getSwatchTextColor(
																seed
															),
														} }
													>
														Input seed
													</span>
												) : null }
												<code>{ color }</code>
											</td>
										);
									} ) }
								</tr>
							);
						} ) }
					</tbody>
				</table>
			</div>
		</section>
	);
}

function ComponentComparison( {
	methods,
	rampsByMethod,
	label,
}: {
	methods: ComparisonRampMethod[];
	rampsByMethod: Map< ComparisonRampMethod, ExperimentalThemeRamps >;
	label: string;
} ) {
	return (
		<section className={ styles[ 'component-comparison' ] }>
			<h3>Representative states</h3>
			<div className={ styles[ 'component-grid' ] }>
				{ methods.map( ( method ) => {
					const ramps = rampsByMethod.get( method )!;
					const neutral = ramps.background.ramp;
					const brand = ramps.primary.ramp;
					const error = ramps.error.ramp;
					const buttonExamples = [
						{
							label: 'Brand button',
							restingBackground: brand.bgFill1,
							activeBackground: brand.bgFill2,
							foreground: brand.fgFill,
						},
						{
							label: 'Neutral button',
							restingBackground: neutral.bgFillInverted1,
							activeBackground: neutral.bgFillInverted2,
							foreground: neutral.fgFillInverted,
						},
						{
							label: 'Error button',
							restingBackground: error.bgFill1,
							activeBackground: error.bgFill2,
							foreground: error.fgFill,
						},
					] as const;
					const tabExamples = [
						{
							label: 'Resting',
							state: 'resting',
							foreground: neutral.fgSurface4,
						},
						{
							label: 'Hover',
							state: 'hover',
							foreground: neutral.fgSurface5,
						},
						{
							label: 'Focus',
							state: 'focus',
							foreground: neutral.fgSurface5,
						},
						{
							label: 'Active',
							state: 'active',
							foreground: neutral.fgSurface5,
						},
						{
							label: 'Disabled',
							state: 'disabled',
							foreground: neutral.fgSurface2,
						},
					] as const;
					return (
						<div
							className={ styles[ 'component-panel' ] }
							key={ method }
							style={
								{
									'--pilot-bg': neutral.surface2,
									'--pilot-fg': neutral.fgSurface5,
									'--pilot-fg-weak': neutral.fgSurface3,
									'--pilot-border': neutral.stroke3,
									'--pilot-focus': brand.stroke3,
								} as React.CSSProperties
							}
						>
							<strong>{ METHOD_DETAILS[ method ].label }</strong>
							<p className={ styles[ 'weak-text' ] }>
								Supporting text and hierarchy
							</p>
							<div className={ styles[ 'state-list' ] }>
								{ buttonExamples.map( ( example ) => (
									<div
										className={ styles[ 'state-sample' ] }
										key={ example.label }
									>
										<span
											className={
												styles[ 'state-label' ]
											}
										>
											{ example.label }
										</span>
										<div
											className={ styles[ 'button-row' ] }
										>
											{ [
												{
													label: 'Resting',
													state: 'resting',
													background:
														example.restingBackground,
													foreground:
														example.foreground,
												},
												{
													label: 'Hover',
													state: 'hover',
													background:
														example.activeBackground,
													foreground:
														example.foreground,
												},
												{
													label: 'Focus',
													state: 'focus',
													background:
														example.activeBackground,
													foreground:
														example.foreground,
												},
												{
													label: 'Active',
													state: 'active',
													background:
														example.activeBackground,
													foreground:
														example.foreground,
												},
												{
													label: 'Disabled',
													state: 'disabled',
													background:
														neutral.surface5,
													foreground:
														neutral.fgSurface2,
												},
											].map( ( state ) => (
												<span
													className={
														styles[ 'state-button' ]
													}
													data-state={ state.state }
													key={ state.state }
													style={ {
														background:
															state.background,
														color: state.foreground,
													} }
												>
													{ state.label }
												</span>
											) ) }
										</div>
									</div>
								) ) }
								<div className={ styles[ 'state-sample' ] }>
									<span className={ styles[ 'state-label' ] }>
										Neutral tabs
									</span>
									<div className={ styles[ 'tabs-row' ] }>
										{ tabExamples.map( ( example ) => (
											<span
												className={
													styles[ 'tab-state' ]
												}
												data-state={ example.state }
												key={ example.state }
												style={ {
													borderBlockEndColor:
														example.state ===
														'active'
															? neutral.stroke4
															: 'transparent',
													color: example.foreground,
												} }
											>
												{ example.label }
											</span>
										) ) }
									</div>
								</div>
							</div>
						</div>
					);
				} ) }
			</div>
			<p className={ styles[ 'component-note' ] }>
				These static samples map the generated ramps for { label } to
				the semantic tokens used by WordPress UI. Focus also includes
				the generated focus stroke. Identical hover and active samples
				mean those states use the same semantic token.
			</p>
		</section>
	);
}

function SeedCombination( {
	label,
	background,
	primary,
	methods,
}: {
	label: string;
	background: string;
	primary: string;
	methods: ComparisonRampMethod[];
} ) {
	const rampsByMethod = new Map(
		methods.map( ( method ) => [
			method,
			getRamps( method, background, primary ),
		] )
	);
	const seeds = {
		background,
		primary,
		error: DEFAULT_SEED_COLORS.error,
	};

	return (
		<article className={ styles[ 'seed-combination' ] }>
			<header>
				<h2>{ label }</h2>
				<div className={ styles.seeds }>
					<Seed label="Neutral" color={ background } />
					<Seed label="Brand" color={ primary } />
					<Seed label="Error" color={ DEFAULT_SEED_COLORS.error } />
				</div>
			</header>
			{ SCALE_DETAILS.map( ( scale ) => (
				<ScaleTable
					key={ scale.name }
					label={ scale.label }
					methods={ methods }
					rampsByMethod={ rampsByMethod }
					scaleName={ scale.name }
					seed={ seeds[ scale.seed ] }
				/>
			) ) }
			<ComponentComparison
				label={ label }
				methods={ methods }
				rampsByMethod={ rampsByMethod }
			/>
		</article>
	);
}

export const Comparison: Story = {
	args: {
		approaches: [
			'trunk-production',
			'anchored',
			'constrained-perceptual',
		],
	},
	render: ( { approaches } ) => {
		const methods = COMPARISON_RAMP_METHODS.filter( ( method ) =>
			approaches.includes( method )
		);

		return (
			<main className={ styles.page }>
				<header className={ styles.introduction }>
					<h1>Perceptual ramp comparison</h1>
					<p>
						Compare each complete neutral, brand, and error ramp by
						step. The default rows show trunk at{ ' ' }
						{ TRUNK_PRODUCTION_COMMIT.slice( 0, 11 ) }, the current
						branch, and the new constrained-perceptual experiment.
						WCAG ratios remain hard gates for the current and
						experimental algorithms. Use the Approaches control to
						show older experiments.
					</p>
				</header>
				{ methods.length === 0 ? (
					<p className={ styles.empty }>
						Select at least one approach.
					</p>
				) : (
					SAMPLE_COMBINATIONS.map( ( combination ) => (
						<SeedCombination
							key={ combination.label }
							{ ...combination }
							methods={ methods }
						/>
					) )
				) }
				<details className={ styles.details }>
					<summary>Approach definitions</summary>
					<dl>
						{ COMPARISON_RAMP_METHODS.map( ( method ) => (
							<div key={ method }>
								<dt>{ METHOD_DETAILS[ method ].label }</dt>
								<dd>
									{ METHOD_DETAILS[ method ].description }
								</dd>
							</div>
						) ) }
					</dl>
				</details>
			</main>
		);
	},
};
