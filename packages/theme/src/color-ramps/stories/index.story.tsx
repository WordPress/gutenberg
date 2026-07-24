import type { Meta, StoryObj } from '@storybook/react-vite';
import { RampTable } from './ramp-table';
import { buildBgRamp, buildAccentRamp, checkAccessibleCombinations } from '..';
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

export const Default: StoryObj< typeof ColorGen > = {
	render: ( args ) => {
		const bgSeed = args.background ?? DEFAULT_SEED_COLORS.background;
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
			// WP Fresh
			{
				background: '#25292b',
				primary: '#3858e9',
			},
			// WP Light
			{
				background: '#eaeeed',
				primary: '#007cba',
			},
			// WP Blue
			{
				background: '#3876a8',
				primary: '#437aa8',
			},
			// WP Coffee
			{
				background: '#5b534d',
				primary: '#916745',
			},
			// WP Ectoplasm
			{
				background: '#4f386e',
				primary: '#646c3e',
			},
			// WP Ocean
			{
				background: '#5f787f',
				primary: '#567958',
			},
			// WP Midnight
			{
				background: '#3d4042',
				primary: '#cf4339',
			},
			// Sunrise
			{
				background: '#cc4541',
				primary: '#ad631e',
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
