import type { Meta, StoryObj } from '@storybook/react-vite';
import { buildAccentRamp, buildBgRamp } from '..';
import { getContrast } from '../lib/color-utils';
import { DEFAULT_SEED_COLORS } from '../lib/constants';
import type { RampResult } from '../lib/types';
import {
	EXPERIMENTAL_FOREGROUND_METHODS,
	buildPerceptualForegroundScale,
	getGamutRelativeChroma,
	getOkhslSaturation,
	getPerceptualContrastMagnitude,
	getSignedPerceptualContrast,
	getStateColorDifference,
	type ExperimentalForegroundMethod,
	type ExperimentalForegroundScale,
	type ExperimentalForegroundScaleType,
} from './perceptual-foreground-experiment';
import styles from './perceptual-foreground-pilot.module.css';

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
		background: '#4f386e',
		primary: '#608010',
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
	ExperimentalForegroundMethod,
	{ label: string; description: string }
> = {
	current: {
		label: 'Current control',
		description:
			'Current four-step ramp, with the strongest value repeated for the fifth step.',
	},
	uniform: {
		label: 'Uniform APCA · fixed Step 5',
		description:
			'Uses five equal intervals ending at the legacy strong endpoint.',
	},
	'semantic-anchors': {
		label: 'Semantic anchors',
		description:
			'Keeps compliant lower steps and the legacy strong endpoint, then inserts a resting step.',
	},
	eased: {
		label: 'Eased APCA',
		description:
			'Uses progressively larger intervals toward the fixed strong endpoint.',
	},
	'uniform-free-endpoint': {
		label: 'Uniform APCA · released Step 5',
		description:
			'Uses equal intervals and the least-extreme Step 5 that supports useful spacing.',
	},
	'state-skewed': {
		label: 'State-skewed APCA · fixed Step 5',
		description:
			'Reserves 40% of the APCA range for the resting-to-active transition ending at the legacy strong endpoint.',
	},
	'state-skewed-relative-chroma': {
		label: 'State-skewed APCA · relative chroma',
		description:
			"Uses the same state spacing and fixed Step 5, while Steps 1–4 preserve the seed's share of available sRGB chroma.",
	},
	'state-skewed-okhsl': {
		label: 'State-skewed APCA · OKHSL saturation',
		description:
			"Uses the same state spacing and fixed Step 5, while Steps 1–4 preserve the seed's OKHSL saturation and hue.",
	},
	'anchored-state-skewed-relative-chroma': {
		label: 'Anchored state-skewed · relative chroma',
		description:
			"Keeps production Steps 1–2 when they meet the hard floors, then applies state-skewed spacing and the seed's relative chroma to Steps 3–4.",
	},
};

type PilotComparisonArgs = {
	approaches: ExperimentalForegroundMethod[];
};

const meta = {
	title: 'Design System/Theme/Theme Provider/Perceptual Foreground Pilot',
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'hidden' } },
	},
	argTypes: {
		approaches: {
			control: {
				type: 'inline-check',
				labels: Object.fromEntries(
					EXPERIMENTAL_FOREGROUND_METHODS.map( ( method ) => [
						method,
						METHOD_DETAILS[ method ].label,
					] )
				),
			},
			description: 'Approaches shown in each scale comparison.',
			options: EXPERIMENTAL_FOREGROUND_METHODS,
		},
	},
} satisfies Meta< PilotComparisonArgs >;

export default meta;

type Story = StoryObj< PilotComparisonArgs >;

type ScaleData = {
	scale: ExperimentalForegroundScale;
	scaleType: ExperimentalForegroundScaleType;
};

function getSwatchTextColor( color: string ) {
	return getContrast( color, '#000000' ) >= getContrast( color, '#ffffff' )
		? '#000000'
		: '#ffffff';
}

function formatSignedContrast( contrast: number ) {
	return `${ contrast >= 0 ? '+' : '' }${ contrast.toFixed( 1 ) }`;
}

function ScaleCell( {
	color,
	contrastMagnitudes,
	data,
	index,
	showGamutRelativeChroma,
	showOkhslSaturation,
	signedContrasts,
}: {
	color: string;
	contrastMagnitudes: number[];
	data: ScaleData;
	index: number;
	showGamutRelativeChroma: boolean;
	showOkhslSaturation: boolean;
	signedContrasts: number[];
} ) {
	const interval =
		index === 0
			? undefined
			: contrastMagnitudes[ index ] - contrastMagnitudes[ index - 1 ];

	return (
		<td
			className={ styles[ 'scale-cell' ] }
			style={ {
				background: color,
				color: getSwatchTextColor( color ),
			} }
		>
			<code>{ color }</code>
			<span>
				Min contrast{ ' ' }
				{ data.scale.minimumContrasts[ index ].toFixed( 2 ) } /{ ' ' }
				{ data.scale.contrastTargets[ index ] }
			</span>
			<span>
				APCA Lc { formatSignedContrast( signedContrasts[ index ] ) }
			</span>
			{ showGamutRelativeChroma ? (
				<span>
					Gamut chroma{ ' ' }
					{ ( getGamutRelativeChroma( color ) * 100 ).toFixed( 0 ) }%
				</span>
			) : null }
			{ showOkhslSaturation ? (
				<span>
					OKHSL saturation{ ' ' }
					{ ( getOkhslSaturation( color ) * 100 ).toFixed( 0 ) }%
				</span>
			) : null }
			{ interval === undefined ? null : (
				<span>Δ |Lc| { interval.toFixed( 1 ) }</span>
			) }
		</td>
	);
}

function ComponentPanel( {
	backgroundRamp,
	neutral,
	brand,
	error,
	method,
	seedLabel,
}: {
	backgroundRamp: RampResult;
	neutral: ExperimentalForegroundScale;
	brand: ExperimentalForegroundScale;
	error: ExperimentalForegroundScale;
	method: ExperimentalForegroundMethod;
	seedLabel: string;
} ) {
	const approachLabel = METHOD_DETAILS[ method ].label;
	const pilotStyles = {
		'--pilot-surface': backgroundRamp.ramp.surface2,
		'--pilot-border': backgroundRamp.ramp.stroke2,
		'--pilot-content-disabled': neutral.colors[ 1 ],
		'--pilot-content-weak': neutral.colors[ 2 ],
		'--pilot-content': neutral.colors[ 4 ],
		'--pilot-neutral-rest': neutral.colors[ 3 ],
		'--pilot-neutral-active': neutral.colors[ 4 ],
		'--pilot-brand-rest': brand.colors[ 3 ],
		'--pilot-brand-active': brand.colors[ 4 ],
		'--pilot-error-rest': error.colors[ 3 ],
		'--pilot-error-active': error.colors[ 4 ],
		'--pilot-focus': brand.colors[ 4 ],
	} as React.CSSProperties;

	return (
		<section
			aria-label={ `${ seedLabel }, ${ approachLabel } component examples` }
			className={ styles[ 'component-panel' ] }
			style={ pilotStyles }
		>
			<div className={ styles[ 'text-hierarchy' ] }>
				<p className={ styles[ 'weak-text' ] }>Weak supporting text</p>
				<p>Normal content remains deliberately strong.</p>
				<button disabled type="button">
					Disabled action
				</button>
			</div>

			<div className={ styles[ 'control-group' ] }>
				<button
					className={ `${ styles[ 'text-button' ] } ${ styles[ 'neutral-interactive' ] }` }
					type="button"
				>
					Resting neutral button
				</button>
				<button
					aria-pressed="true"
					className={ `${ styles[ 'text-button' ] } ${ styles[ 'neutral-interactive' ] } ${ styles[ 'forced-active' ] }` }
					type="button"
				>
					Pressed neutral button
				</button>
			</div>

			<p className={ styles.links }>
				<a
					className={ styles[ 'brand-interactive' ] }
					href="#pilot-link"
				>
					Brand link
				</a>{ ' ' }
				<a
					aria-current="page"
					className={ `${ styles[ 'brand-interactive' ] } ${ styles[ 'forced-active' ] }` }
					href="#pilot-current-link"
				>
					Current brand link
				</a>
			</p>

			<nav
				aria-label={ `${ seedLabel }, ${ approachLabel } view switcher` }
			>
				<ul className={ styles[ 'view-switcher' ] }>
					<li>
						<a
							className={ styles[ 'neutral-interactive' ] }
							href="#pilot-overview"
						>
							Overview
						</a>
					</li>
					<li>
						<a
							aria-current="page"
							className={ `${ styles[ 'neutral-interactive' ] } ${ styles[ 'forced-active' ] }` }
							href="#pilot-settings"
						>
							Settings
						</a>
					</li>
				</ul>
			</nav>

			<nav
				aria-label={ `${ seedLabel }, ${ approachLabel } menu` }
				className={ styles.menu }
			>
				<strong className={ styles[ 'menu-label' ] }>Appearance</strong>
				<ul>
					<li>
						<a
							className={ styles[ 'neutral-interactive' ] }
							href="#pilot-dashboard"
						>
							Dashboard
						</a>
					</li>
					<li>
						<a
							aria-current="page"
							className={ `${ styles[ 'neutral-interactive' ] } ${ styles[ 'forced-active' ] }` }
							href="#pilot-styles"
						>
							Styles
						</a>
					</li>
					<li>
						<button disabled type="button">
							Plugins
						</button>
					</li>
				</ul>
			</nav>

			<div className={ styles[ 'control-group' ] }>
				<button
					className={ `${ styles[ 'text-button' ] } ${ styles[ 'error-interactive' ] }` }
					type="button"
				>
					Delete
				</button>
				<button
					aria-pressed="true"
					className={ `${ styles[ 'text-button' ] } ${ styles[ 'error-interactive' ] } ${ styles[ 'forced-active' ] }` }
					type="button"
				>
					Confirm delete
				</button>
			</div>
		</section>
	);
}

function buildScaleData( {
	method,
	ramp,
	backgroundRamp,
	seed,
	scaleType,
}: {
	method: ExperimentalForegroundMethod;
	ramp: RampResult;
	backgroundRamp: RampResult;
	seed: string;
	scaleType: ExperimentalForegroundScaleType;
} ): ScaleData {
	return {
		scaleType,
		scale: buildPerceptualForegroundScale( {
			method,
			ramp,
			backgroundRamp,
			seed,
			scaleType,
		} ),
	};
}

type ScaleName = 'neutral' | 'brand' | 'error';

type MethodScaleData = {
	method: ExperimentalForegroundMethod;
	scales: Record< ScaleName, ScaleData >;
};

const SCALE_COMPARISONS = [
	{ label: 'Neutral', name: 'neutral' },
	{ label: 'Brand', name: 'brand' },
	{ label: 'Error', name: 'error' },
] as const;

const GAMUT_CHROMA_METHODS = new Set< ExperimentalForegroundMethod >( [
	'state-skewed',
	'state-skewed-relative-chroma',
	'state-skewed-okhsl',
	'anchored-state-skewed-relative-chroma',
] );

const OKHSL_SATURATION_METHODS = new Set< ExperimentalForegroundMethod >( [
	'state-skewed-relative-chroma',
	'state-skewed-okhsl',
	'anchored-state-skewed-relative-chroma',
] );

function buildMethodScaleData( {
	method,
	backgroundRamp,
	primaryRamp,
	errorRamp,
}: {
	method: ExperimentalForegroundMethod;
	backgroundRamp: RampResult;
	primaryRamp: RampResult;
	errorRamp: RampResult;
} ): MethodScaleData {
	return {
		method,
		scales: {
			neutral: buildScaleData( {
				method,
				ramp: backgroundRamp,
				backgroundRamp,
				seed: backgroundRamp.ramp.surface2,
				scaleType: 'neutral',
			} ),
			brand: buildScaleData( {
				method,
				ramp: primaryRamp,
				backgroundRamp,
				seed: primaryRamp.ramp.bgFill1,
				scaleType: 'accent',
			} ),
			error: buildScaleData( {
				method,
				ramp: errorRamp,
				backgroundRamp,
				seed: errorRamp.ramp.bgFill1,
				scaleType: 'accent',
			} ),
		},
	};
}

function ApproachCard( {
	children,
	method,
}: {
	children: React.ReactNode;
	method: ExperimentalForegroundMethod;
} ) {
	return (
		<article className={ styles[ 'approach-card' ] }>
			<header>
				<h4>{ METHOD_DETAILS[ method ].label }</h4>
			</header>
			{ children }
		</article>
	);
}

function ScaleComparison( {
	comparison,
	displayBackground,
	methods,
	seedLabel,
}: {
	comparison: ( typeof SCALE_COMPARISONS )[ number ];
	displayBackground: string;
	methods: MethodScaleData[];
	seedLabel: string;
} ) {
	return (
		<section className={ styles[ 'scale-comparison' ] }>
			<h3>{ comparison.label }</h3>
			<div
				aria-label={ `${ seedLabel }, ${ comparison.label } scale approaches` }
				className={ styles[ 'scale-table-scroll' ] }
				role="region"
				tabIndex={ 0 }
			>
				<table
					aria-label={ `${ seedLabel }, ${ comparison.label } scale comparison` }
					className={ styles[ 'scale-table' ] }
				>
					<thead>
						<tr>
							<th scope="col">Approach</th>
							{ [ 1, 2, 3, 4, 5 ].map( ( step ) => (
								<th key={ step } scope="col">
									FGS{ step }
								</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ methods.map( ( { method, scales } ) => {
							const data = scales[ comparison.name ];
							const contrastMagnitudes = data.scale.colors.map(
								( color ) =>
									getPerceptualContrastMagnitude(
										displayBackground,
										color
									)
							);
							const signedContrasts = data.scale.colors.map(
								( color ) =>
									getSignedPerceptualContrast(
										displayBackground,
										color
									)
							);
							const showGamutRelativeChroma =
								data.scaleType === 'accent' &&
								GAMUT_CHROMA_METHODS.has( method );
							const showOkhslSaturation =
								data.scaleType === 'accent' &&
								OKHSL_SATURATION_METHODS.has( method );

							return (
								<tr key={ method }>
									<th
										className={ styles[ 'method-cell' ] }
										scope="row"
									>
										<strong>
											{ METHOD_DETAILS[ method ].label }
										</strong>
										<div
											className={
												styles[ 'method-meta' ]
											}
										>
											<span
												className={
													styles[ 'state-difference' ]
												}
											>
												FGS4→5 ΔEOK2{ ' ' }
												{ getStateColorDifference(
													data.scale.colors
												).toFixed( 3 ) }
											</span>
											<span
												className={ styles.status }
												data-pass={
													data.scale
														.meetsContrastTargets
												}
											>
												{ data.scale
													.meetsContrastTargets
													? 'Contrast targets pass'
													: 'Contrast target warning' }
											</span>
										</div>
									</th>
									{ data.scale.colors.map(
										( color, index ) => (
											<ScaleCell
												color={ color }
												contrastMagnitudes={
													contrastMagnitudes
												}
												data={ data }
												index={ index }
												key={ `${ color }-${ index }` }
												showGamutRelativeChroma={
													showGamutRelativeChroma
												}
												showOkhslSaturation={
													showOkhslSaturation
												}
												signedContrasts={
													signedContrasts
												}
											/>
										)
									) }
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
	backgroundRamp,
	methods,
	seedLabel,
}: {
	backgroundRamp: RampResult;
	methods: MethodScaleData[];
	seedLabel: string;
} ) {
	return (
		<section className={ styles[ 'scale-comparison' ] }>
			<h3>Representative components</h3>
			<div
				aria-label={ `${ seedLabel }, representative component approaches` }
				className={ styles.approaches }
				role="region"
				tabIndex={ 0 }
			>
				{ methods.map( ( { method, scales } ) => (
					<ApproachCard key={ method } method={ method }>
						<ComponentPanel
							backgroundRamp={ backgroundRamp }
							brand={ scales.brand.scale }
							error={ scales.error.scale }
							method={ method }
							neutral={ scales.neutral.scale }
							seedLabel={ seedLabel }
						/>
					</ApproachCard>
				) ) }
			</div>
		</section>
	);
}

function ApproachDescriptions( {
	methods,
}: {
	methods: ExperimentalForegroundMethod[];
} ) {
	return (
		<details className={ styles[ 'approach-descriptions' ] }>
			<summary>Approach descriptions</summary>
			<dl>
				{ methods.map( ( method ) => (
					<div key={ method }>
						<dt>{ METHOD_DETAILS[ method ].label }</dt>
						<dd>{ METHOD_DETAILS[ method ].description }</dd>
					</div>
				) ) }
			</dl>
		</details>
	);
}

function PilotComparison( { approaches }: PilotComparisonArgs ) {
	const visibleMethods = EXPERIMENTAL_FOREGROUND_METHODS.filter( ( method ) =>
		approaches.includes( method )
	);

	return (
		<div className={ styles.page }>
			<header className={ styles.introduction }>
				<h1>Perceptual foreground scale pilot</h1>
				<p>
					APCA controls experimental spacing only. WCAG 2.1 contrast
					ratios measure hard role targets against every reference
					surface assigned to a step. The 2:1 and 3:1 targets are
					design targets, not general text-conformance thresholds.
				</p>
				<p>
					Control warnings identify values that miss this pilot&apos;s
					broader multi-surface checks. They do not describe a runtime
					regression.
				</p>
				<p>
					Neutral scales use the production foreground chroma taper.
					Most brand and error scales preserve absolute seed chroma.
					The global relative-chroma variant preserves the seed&apos;s
					share of available sRGB chroma across Steps 1–4. The
					anchored variant keeps production Steps 1–2 and applies
					relative chroma to Steps 3–4. The OKHSL variant preserves
					the seed&apos;s OKHSL saturation and hue. The state-skewed
					cards report Gamut chroma. The last three also report OKHSL
					saturation. FGS4→5 ΔEOK2 measures the resting-to-active
					color difference. Signed APCA Lc exposes contrast polarity,
					while its magnitude controls spacing.
				</p>
				<p>
					Only Uniform APCA · released Step 5 removes the legacy
					endpoint constraint. It targets a seven-point APCA interval,
					or the largest available interval when space is limited.
				</p>
				<p>
					Use the Approaches control to show or hide methods. Each
					scale keeps the methods ordered from the current control to
					the latest iteration.
				</p>
			</header>
			{ visibleMethods.length === 0 ? (
				<p className={ styles[ 'empty-state' ] }>
					Select at least one approach in the Controls panel.
				</p>
			) : null }
			{ visibleMethods.length > 0 ? (
				<ApproachDescriptions methods={ visibleMethods } />
			) : null }
			{ visibleMethods.length > 0
				? SAMPLE_COMBINATIONS.map( ( combination ) => {
						const backgroundRamp = buildBgRamp(
							combination.background
						);
						const primaryRamp = buildAccentRamp(
							combination.primary,
							backgroundRamp
						);
						const errorRamp = buildAccentRamp(
							DEFAULT_SEED_COLORS.error,
							backgroundRamp
						);
						const methods = visibleMethods.map( ( method ) =>
							buildMethodScaleData( {
								backgroundRamp,
								errorRamp,
								method,
								primaryRamp,
							} )
						);

						return (
							<section
								className={ styles[ 'seed-section' ] }
								key={ combination.label }
							>
								<header>
									<h2>{ combination.label }</h2>
									<p>
										Background{ ' ' }
										<code>{ combination.background }</code>{ ' ' }
										· Primary{ ' ' }
										<code>{ combination.primary }</code>
									</p>
								</header>
								{ SCALE_COMPARISONS.map( ( comparison ) => (
									<ScaleComparison
										comparison={ comparison }
										displayBackground={
											backgroundRamp.ramp.surface2
										}
										key={ comparison.name }
										methods={ methods }
										seedLabel={ combination.label }
									/>
								) ) }
								<ComponentComparison
									backgroundRamp={ backgroundRamp }
									methods={ methods }
									seedLabel={ combination.label }
								/>
							</section>
						);
				  } )
				: null }
		</div>
	);
}

export const Comparison: Story = {
	args: {
		approaches: [ ...EXPERIMENTAL_FOREGROUND_METHODS ],
	},
	render: ( args ) => <PilotComparison { ...args } />,
};
