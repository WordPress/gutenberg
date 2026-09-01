import type { Meta, StoryObj } from '@storybook/react-vite';
import { buildAccentRamp, buildBgRamp } from '..';
import { getContrast } from '../lib/color-utils';
import { DEFAULT_SEED_COLORS } from '../lib/constants';
import type { RampResult } from '../lib/types';
import {
	EXPERIMENTAL_FOREGROUND_METHODS,
	buildPerceptualForegroundScale,
	getGamutRelativeChroma,
	getPerceptualContrastMagnitude,
	getSignedPerceptualContrast,
	getStateColorDifference,
	type ExperimentalForegroundMethod,
	type ExperimentalForegroundScale,
	type ExperimentalForegroundScaleType,
} from './perceptual-foreground-experiment';
import styles from './perceptual-foreground-pilot.module.css';

const meta = {
	title: 'Design System/Theme/Theme Provider/Perceptual Foreground Pilot',
	parameters: {
		controls: { disable: true },
		docs: { canvas: { sourceState: 'hidden' } },
	},
} satisfies Meta;

export default meta;

type Story = StoryObj< typeof meta >;

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
	'uniform-free-endpoint': {
		label: 'Uniform APCA · released Step 5',
		description:
			'Uses equal intervals and the least-extreme Step 5 that supports useful spacing.',
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
};

type ScaleData = {
	label: string;
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

function ForegroundScale( {
	data,
	displayBackground,
	showGamutRelativeChroma,
}: {
	data: ScaleData;
	displayBackground: string;
	showGamutRelativeChroma: boolean;
} ) {
	const contrastMagnitudes = data.scale.colors.map( ( color ) =>
		getPerceptualContrastMagnitude( displayBackground, color )
	);
	const signedContrasts = data.scale.colors.map( ( color ) =>
		getSignedPerceptualContrast( displayBackground, color )
	);
	const stateColorDifference = getStateColorDifference( data.scale.colors );

	return (
		<section
			className={ styles.scale }
			aria-label={ `${ data.label } scale` }
		>
			<div className={ styles[ 'scale-heading' ] }>
				<h4>{ data.label }</h4>
				<div className={ styles[ 'scale-meta' ] }>
					<span className={ styles[ 'state-difference' ] }>
						FGS4→5 ΔEOK2 { stateColorDifference.toFixed( 3 ) }
					</span>
					<span
						className={ styles.status }
						data-pass={ data.scale.meetsContrastTargets }
					>
						{ data.scale.meetsContrastTargets
							? 'Contrast targets pass'
							: 'Contrast target warning' }
					</span>
				</div>
			</div>
			<div className={ styles.swatches }>
				{ data.scale.colors.map( ( color, index ) => {
					const interval =
						index === 0
							? undefined
							: contrastMagnitudes[ index ] -
							  contrastMagnitudes[ index - 1 ];

					return (
						<div
							className={ styles.swatch }
							key={ `${ color }-${ index }` }
							style={ {
								background: color,
								color: getSwatchTextColor( color ),
							} }
						>
							<strong>FGS{ index + 1 }</strong>
							<code>{ color }</code>
							<span>
								Min contrast{ ' ' }
								{ data.scale.minimumContrasts[ index ].toFixed(
									2
								) }{ ' ' }
								/ { data.scale.contrastTargets[ index ] }
							</span>
							<span>
								APCA Lc{ ' ' }
								{ formatSignedContrast(
									signedContrasts[ index ]
								) }
							</span>
							{ showGamutRelativeChroma ? (
								<span>
									Gamut chroma{ ' ' }
									{ (
										getGamutRelativeChroma( color ) * 100
									).toFixed( 0 ) }
									%
								</span>
							) : null }
							{ interval === undefined ? null : (
								<span>Δ |Lc| { interval.toFixed( 1 ) }</span>
							) }
						</div>
					);
				} ) }
			</div>
		</section>
	);
}

function ComponentPanel( {
	backgroundRamp,
	neutral,
	brand,
	error,
	method,
}: {
	backgroundRamp: RampResult;
	neutral: ExperimentalForegroundScale;
	brand: ExperimentalForegroundScale;
	error: ExperimentalForegroundScale;
	method: ExperimentalForegroundMethod;
} ) {
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
			aria-label={ `${ METHOD_DETAILS[ method ].label } component examples` }
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

			<nav aria-label="Example view switcher">
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

			<nav aria-label="Example menu" className={ styles.menu }>
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
	label,
	method,
	ramp,
	backgroundRamp,
	seed,
	scaleType,
}: {
	label: string;
	method: ExperimentalForegroundMethod;
	ramp: RampResult;
	backgroundRamp: RampResult;
	seed: string;
	scaleType: ExperimentalForegroundScaleType;
} ): ScaleData {
	return {
		label,
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

function VariantCard( {
	method,
	backgroundRamp,
	primaryRamp,
	errorRamp,
}: {
	method: ExperimentalForegroundMethod;
	backgroundRamp: RampResult;
	primaryRamp: RampResult;
	errorRamp: RampResult;
} ) {
	const scales = [
		buildScaleData( {
			label: 'Neutral',
			method,
			ramp: backgroundRamp,
			backgroundRamp,
			seed: backgroundRamp.ramp.surface2,
			scaleType: 'neutral',
		} ),
		buildScaleData( {
			label: 'Brand',
			method,
			ramp: primaryRamp,
			backgroundRamp,
			seed: primaryRamp.ramp.bgFill1,
			scaleType: 'accent',
		} ),
		buildScaleData( {
			label: 'Error',
			method,
			ramp: errorRamp,
			backgroundRamp,
			seed: errorRamp.ramp.bgFill1,
			scaleType: 'accent',
		} ),
	] as const;

	return (
		<article className={ styles[ 'variant-card' ] }>
			<header>
				<h3>{ METHOD_DETAILS[ method ].label }</h3>
				<p>{ METHOD_DETAILS[ method ].description }</p>
			</header>
			{ scales.map( ( data ) => (
				<ForegroundScale
					data={ data }
					displayBackground={ backgroundRamp.ramp.surface2 }
					key={ data.label }
					showGamutRelativeChroma={
						data.scaleType === 'accent' &&
						( method === 'state-skewed' ||
							method === 'state-skewed-relative-chroma' )
					}
				/>
			) ) }
			<ComponentPanel
				backgroundRamp={ backgroundRamp }
				brand={ scales[ 1 ].scale }
				error={ scales[ 2 ].scale }
				method={ method }
				neutral={ scales[ 0 ].scale }
			/>
		</article>
	);
}

function PilotComparison() {
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
					The relative-chroma variant preserves the seed&apos;s share
					of available sRGB chroma across Steps 1–4 instead. The two
					state-skewed cards report that share as Gamut chroma. FGS4→5
					ΔEOK2 measures the resting-to-active color difference.
					Signed APCA Lc exposes contrast polarity, while its
					magnitude controls spacing.
				</p>
				<p>
					Only Uniform APCA · released Step 5 removes the legacy
					endpoint constraint. It targets a seven-point APCA interval,
					or the largest available interval when space is limited.
				</p>
			</header>
			{ SAMPLE_COMBINATIONS.map( ( combination ) => {
				const backgroundRamp = buildBgRamp( combination.background );
				const primaryRamp = buildAccentRamp(
					combination.primary,
					backgroundRamp
				);
				const errorRamp = buildAccentRamp(
					DEFAULT_SEED_COLORS.error,
					backgroundRamp
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
								<code>{ combination.background }</code> ·
								Primary <code>{ combination.primary }</code>
							</p>
						</header>
						<div className={ styles.variants }>
							{ EXPERIMENTAL_FOREGROUND_METHODS.map(
								( method ) => (
									<VariantCard
										backgroundRamp={ backgroundRamp }
										errorRamp={ errorRamp }
										key={ method }
										method={ method }
										primaryRamp={ primaryRamp }
									/>
								)
							) }
						</div>
					</section>
				);
			} ) }
		</div>
	);
}

export const Comparison: Story = {
	render: () => <PilotComparison />,
};
