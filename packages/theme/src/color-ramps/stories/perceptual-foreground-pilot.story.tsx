import type { Meta, StoryObj } from '@storybook/react-vite';
import { buildAccentRamp, buildBgRamp } from '..';
import { getContrast } from '../lib/color-utils';
import { DEFAULT_SEED_COLORS } from '../lib/constants';
import type { RampResult } from '../lib/types';
import {
	EXPERIMENTAL_FOREGROUND_METHODS,
	buildPerceptualForegroundScale,
	getPerceptualContrast,
	type ExperimentalForegroundMethod,
	type ExperimentalForegroundScale,
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
		label: 'Uniform APCA',
		description:
			'Five equal perceptual intervals. The weak endpoint can move to preserve every WCAG floor.',
	},
	'semantic-anchors': {
		label: 'Semantic anchors',
		description:
			'Keeps compliant lower steps, then divides the remaining normal-to-strong headroom.',
	},
	eased: {
		label: 'Eased APCA',
		description:
			'Uses progressively larger perceptual intervals toward resting and active foregrounds.',
	},
};

type ScaleData = {
	label: string;
	scale: ExperimentalForegroundScale;
};

function getSwatchTextColor( color: string ) {
	return getContrast( color, '#000000' ) >= getContrast( color, '#ffffff' )
		? '#000000'
		: '#ffffff';
}

function ForegroundScale( {
	data,
	displayBackground,
}: {
	data: ScaleData;
	displayBackground: string;
} ) {
	const contrasts = data.scale.colors.map( ( color ) =>
		getPerceptualContrast( displayBackground, color )
	);

	return (
		<section
			className={ styles.scale }
			aria-label={ `${ data.label } scale` }
		>
			<div className={ styles[ 'scale-heading' ] }>
				<h4>{ data.label }</h4>
				<span
					className={ styles.status }
					data-pass={ data.scale.meetsWcagFloors }
				>
					{ data.scale.meetsWcagFloors
						? 'WCAG floors pass'
						: 'WCAG floor warning' }
				</span>
			</div>
			<div className={ styles.swatches }>
				{ data.scale.colors.map( ( color, index ) => {
					const interval =
						index === 0
							? undefined
							: contrasts[ index ] - contrasts[ index - 1 ];

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
								WCAG{ ' ' }
								{ getContrast(
									displayBackground,
									color
								).toFixed( 2 ) }
							</span>
							<span>
								APCA { contrasts[ index ].toFixed( 1 ) }
							</span>
							{ interval === undefined ? null : (
								<span>Δ { interval.toFixed( 1 ) }</span>
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
}: {
	label: string;
	method: ExperimentalForegroundMethod;
	ramp: RampResult;
	backgroundRamp: RampResult;
	seed: string;
} ): ScaleData {
	return {
		label,
		scale: buildPerceptualForegroundScale( {
			method,
			ramp,
			backgroundRamp,
			seed,
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
		} ),
		buildScaleData( {
			label: 'Brand',
			method,
			ramp: primaryRamp,
			backgroundRamp,
			seed: primaryRamp.ramp.bgFill1,
		} ),
		buildScaleData( {
			label: 'Error',
			method,
			ramp: errorRamp,
			backgroundRamp,
			seed: errorRamp.ramp.bgFill1,
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
					APCA controls experimental spacing only. WCAG contrast
					remains a hard constraint against every reference surface
					assigned to a step.
				</p>
				<p>
					Control warnings identify values that miss this pilot&apos;s
					broader multi-surface checks. They do not describe a runtime
					regression.
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
