/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import { RampTable } from './ramp-table';
import { buildBgRamp, buildAccentRamp, checkAccessibleCombinations } from '..';
import { DEFAULT_SEED_COLORS, getQualitativeSeeds } from '../lib/constants';

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
	tags: [ 'status-experimental' ],
};
export default meta;

export const Default: StoryObj< typeof ColorGen > = {
	render: ( args ) => {
		const bgSeed = args.background ?? DEFAULT_SEED_COLORS.bg;
		const primarySeed = args.primary ?? DEFAULT_SEED_COLORS.primary;
		const bgRamp = buildBgRamp( bgSeed );

		const bgRampObj = {
			seed: {
				name: 'surface2' as const,
				value: bgSeed,
			},
			ramp: bgRamp.ramp,
		};

		const primaryRampObj = {
			seed: {
				name: 'bgFill1' as const,
				value: primarySeed,
			},
			ramp: buildAccentRamp( primarySeed, bgRamp ).ramp,
		};
		const infoRampObj = {
			seed: {
				name: 'bgFill1' as const,
				value: DEFAULT_SEED_COLORS.info,
			},
			ramp: buildAccentRamp( DEFAULT_SEED_COLORS.info, bgRamp ).ramp,
		};
		const successRampObj = {
			seed: {
				name: 'bgFill1' as const,
				value: DEFAULT_SEED_COLORS.success,
			},
			ramp: buildAccentRamp( DEFAULT_SEED_COLORS.success, bgRamp ).ramp,
		};
		const warningRampObj = {
			seed: {
				name: 'bgFill1' as const,
				value: DEFAULT_SEED_COLORS.warning,
			},
			ramp: buildAccentRamp( DEFAULT_SEED_COLORS.warning, bgRamp ).ramp,
		};
		const cautionRampObj = {
			seed: {
				name: 'bgFill1' as const,
				value: DEFAULT_SEED_COLORS.caution,
			},
			ramp: buildAccentRamp( DEFAULT_SEED_COLORS.caution, bgRamp ).ramp,
		};
		const errorRampObj = {
			seed: {
				name: 'bgFill1' as const,
				value: DEFAULT_SEED_COLORS.error,
			},
			ramp: buildAccentRamp( DEFAULT_SEED_COLORS.error, bgRamp ).ramp,
		};

		// Generate qualitative accent ramps from the primary seed
		const qualitativeSeeds = getQualitativeSeeds( primarySeed );
		const accentRampObjs = (
			Object.entries( qualitativeSeeds ) as [
				keyof typeof qualitativeSeeds,
				string,
			][]
		 ).map( ( [ name, seed ] ) => ( {
			seed: {
				name: 'bgFill1' as const,
				value: seed,
			},
			ramp: buildAccentRamp( seed, bgRamp ).ramp,
			label: name,
		} ) );

		const unmetTargets = checkAccessibleCombinations( {
			bgRamp,
		} );

		return (
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: '32px',
				} }
			>
				<div>
					<h3 style={ { marginBottom: 8 } }>Semantic Color Ramps</h3>
					<RampTable
						ramps={ [
							bgRampObj,
							primaryRampObj,
							infoRampObj,
							successRampObj,
							warningRampObj,
							cautionRampObj,
							errorRampObj,
						] }
					/>
				</div>

				<div>
					<h3 style={ { marginBottom: 8 } }>
						Qualitative Accent Ramps (hue rotations from primary)
					</h3>
					<p
						style={ {
							fontSize: 12,
							color: '#666',
							marginBottom: 12,
						} }
					>
						8 distinct colors for visual differentiation (e.g.,
						collaborator avatars). Primary (0°) + accent1-7 (45°
						increments).
					</p>
					<RampTable
						ramps={ [ primaryRampObj, ...accentRampObjs ] }
					/>
				</div>

				{ unmetTargets.length === 0 ? (
					<p>All accessibility targets met</p>
				) : (
					<ul>
						{ unmetTargets.map(
							(
								{
									bgName,
									bgColor,
									fgName,
									fgColor,
									unmetContrast,
									achievedContrast,
								},
								i
							) => (
								<li key={ i }>
									{ fgName } (
									<span
										style={ {
											width: 20,
											height: 20,
											backgroundColor: fgColor,
											display: 'inline-block',
										} }
									/>
									{ fgColor }) over { bgName } (
									<span
										style={ {
											width: 20,
											height: 20,
											backgroundColor: bgColor,
											display: 'inline-block',
										} }
									/>
									{ bgColor }) did not meet { unmetContrast },
									achieved just { achievedContrast }
								</li>
							)
						) }
					</ul>
				) }
			</div>
		);
	},
	args: {},
};

export const SampleCombinations: StoryObj< typeof ColorGen > = {
	render: () => {
		const combinations = [
			// WordPress (light / dark)
			{
				background: '#f8f8f8',
				primary: '#3858e9',
			},
			{
				background: '#1e1e1e',
				primary: '#3858e9',
			},
			// WP Classic
			{
				background: '#1d2327',
				primary: '#2271b1',
			},
			// WP Light
			{
				background: '#e5e5e5',
				primary: '#d64e07',
			},
			// WP Blue
			{
				background: '#096484',
				primary: '#52accc',
			},
			// WP Coffee
			{
				background: '#46403c',
				primary: '#c7a589',
			},
			// WP Ectoplasm
			{
				background: '#413256',
				primary: '#a3b745',
			},
			// WP Ocean
			{
				background: '#627c83',
				primary: '#9ebaa0',
			},
			// Sunrise
			{
				background: '#b43c38',
				primary: '#dd823b',
			},
		];

		const ramps = combinations.map( ( { background, primary } ) => {
			const bgRamp = buildBgRamp( background );

			const bgRampObj = {
				seed: {
					name: 'surface2' as const,
					value: background,
				},
				ramp: bgRamp.ramp,
				warnings: bgRamp.warnings,
			};

			const primaryRamp = buildAccentRamp( primary, bgRamp );
			const primaryRampObj = {
				seed: {
					name: 'bgFill1' as const,
					value: primary,
				},
				ramp: primaryRamp.ramp,
				warnings: primaryRamp.warnings,
			};

			return [ bgRampObj, primaryRampObj ];
		} );

		return (
			<div
				style={ { display: 'flex', flexDirection: 'column', gap: 16 } }
			>
				{ ramps.map( ( r, i ) => (
					<RampTable key={ i } ramps={ r } />
				) ) }
			</div>
		);
	},
	argTypes: {
		background: {
			control: false,
		},
		primary: {
			control: false,
		},
	},
};

export const QualitativePalette: StoryObj< typeof ColorGen > = {
	render: ( args ) => {
		const primarySeed = args.primary ?? DEFAULT_SEED_COLORS.primary;
		const bgSeed = args.background ?? DEFAULT_SEED_COLORS.bg;
		const bgRamp = buildBgRamp( bgSeed );

		// Generate all 8 qualitative colors (primary + accent1-7)
		const qualitativeSeeds = getQualitativeSeeds( primarySeed );
		const allSeeds = [
			{ name: 'primary', seed: primarySeed, rotation: '0°' },
			{
				name: 'accent1',
				seed: qualitativeSeeds.accent1,
				rotation: '45°',
			},
			{
				name: 'accent2',
				seed: qualitativeSeeds.accent2,
				rotation: '90°',
			},
			{
				name: 'accent3',
				seed: qualitativeSeeds.accent3,
				rotation: '135°',
			},
			{
				name: 'accent4',
				seed: qualitativeSeeds.accent4,
				rotation: '180°',
			},
			{
				name: 'accent5',
				seed: qualitativeSeeds.accent5,
				rotation: '225°',
			},
			{
				name: 'accent6',
				seed: qualitativeSeeds.accent6,
				rotation: '270°',
			},
			{
				name: 'accent7',
				seed: qualitativeSeeds.accent7,
				rotation: '315°',
			},
		];

		const ramps = allSeeds.map( ( { name, seed, rotation } ) => {
			const accentRamp = buildAccentRamp( seed, bgRamp );
			return { name, seed, rotation, ramp: accentRamp.ramp };
		} );

		return (
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 32,
					fontFamily: '-apple-system, "system-ui", sans-serif',
				} }
			>
				<div>
					<h3>Qualitative Color Palette</h3>
					<p style={ { fontSize: 14, color: '#666', maxWidth: 600 } }>
						8 visually distinct colors derived by rotating the
						primary hue in 45° increments. Use for distinguishing
						items that need color differentiation without semantic
						meaning (e.g., collaborator avatars, chart series,
						tags).
					</p>
				</div>

				<div>
					<h4 style={ { marginBottom: 12 } }>Avatar Example</h4>
					<div
						style={ {
							display: 'flex',
							gap: 8,
							flexWrap: 'wrap',
						} }
					>
						{ ramps.map( ( { name, ramp }, i ) => (
							<div
								key={ name }
								style={ {
									width: 48,
									height: 48,
									borderRadius: '50%',
									backgroundColor: ramp.bgFill1,
									color: ramp.fgFill,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 600,
									fontSize: 16,
								} }
								title={ name }
							>
								{ String.fromCharCode( 65 + i ) }
								{ String.fromCharCode(
									65 + ( ( i + 1 ) % 26 )
								) }
							</div>
						) ) }
					</div>
				</div>

				<div>
					<h4 style={ { marginBottom: 12 } }>Color Swatches</h4>
					<div
						style={ {
							display: 'grid',
							gridTemplateColumns: 'repeat(8, 1fr)',
							gap: 8,
						} }
					>
						{ ramps.map( ( { name, seed, rotation, ramp } ) => (
							<div
								key={ name }
								style={ {
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 4,
								} }
							>
								<div
									style={ {
										width: '100%',
										height: 60,
										backgroundColor: ramp.bgFill1,
										borderRadius: 8,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: ramp.fgFill,
										fontWeight: 500,
									} }
								>
									Aa
								</div>
								<span
									style={ { fontSize: 11, fontWeight: 500 } }
								>
									{ name }
								</span>
								<span style={ { fontSize: 10, color: '#888' } }>
									{ rotation }
								</span>
								<span style={ { fontSize: 10, color: '#888' } }>
									{ seed }
								</span>
							</div>
						) ) }
					</div>
				</div>

				<div>
					<h4 style={ { marginBottom: 12 } }>
						Full Ramps (bgFill1 + fgFill pairs)
					</h4>
					<div
						style={ {
							display: 'grid',
							gridTemplateColumns: 'repeat(4, 1fr)',
							gap: 16,
						} }
					>
						{ ramps.map( ( { name, ramp } ) => (
							<div
								key={ name }
								style={ {
									display: 'flex',
									flexDirection: 'column',
									gap: 2,
								} }
							>
								<span
									style={ {
										fontSize: 11,
										fontWeight: 500,
										marginBottom: 4,
									} }
								>
									{ name }
								</span>
								<div
									style={ {
										height: 32,
										backgroundColor: ramp.bgFill1,
										borderRadius: '4px 4px 0 0',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: ramp.fgFill,
										fontSize: 12,
									} }
								>
									bgFill1 + fgFill
								</div>
								<div
									style={ {
										height: 24,
										backgroundColor: ramp.surface4,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: ramp.fgSurface4,
										fontSize: 10,
									} }
								>
									surface4
								</div>
								<div
									style={ {
										height: 24,
										backgroundColor: ramp.surface2,
										borderRadius: '0 0 4px 4px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: ramp.fgSurface3,
										fontSize: 10,
									} }
								>
									surface2
								</div>
							</div>
						) ) }
					</div>
				</div>
			</div>
		);
	},
	args: {},
};
