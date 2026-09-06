import { forwardRef } from '@wordpress/element';
import type {
	ThemeProviderColorRampName,
	ThemeProviderColorWarning,
} from '../../theme-provider-color-warnings';
import colorTokenAliases from '../../prebuilt/ts/color-tokens';
import { getColorString } from '../lib/color-utils';
import type { Ramp } from '../lib/types';

// TODO: show token groups better
const RAMP_TOKENS_ORDER: { tokenName: keyof Ramp; abbr: string }[] = [
	{ tokenName: 'surface1', abbr: 'SF1' },
	{ tokenName: 'surface2', abbr: 'SF2' },
	{ tokenName: 'surface3', abbr: 'SF3' },
	{ tokenName: 'surface4', abbr: 'SF4' },
	{ tokenName: 'surface5', abbr: 'SF5' },
	{ tokenName: 'surface6', abbr: 'SF6' },
	{ tokenName: 'bgFill1', abbr: 'BGF1' },
	{ tokenName: 'bgFill2', abbr: 'BGF2' },
	{ tokenName: 'bgFillInverted1', abbr: 'BGFI1' },
	{ tokenName: 'bgFillInverted2', abbr: 'BGFI2' },
	{ tokenName: 'bgFillDark', abbr: 'BGFD' },
	{ tokenName: 'stroke1', abbr: 'ST1' },
	{ tokenName: 'stroke2', abbr: 'ST2' },
	{ tokenName: 'stroke3', abbr: 'ST3' },
	{ tokenName: 'stroke4', abbr: 'ST4' },
	{ tokenName: 'fgSurface1', abbr: 'FGS1' },
	{ tokenName: 'fgSurface2', abbr: 'FGS2' },
	{ tokenName: 'fgSurface3', abbr: 'FGS3' },
	{ tokenName: 'fgSurface4', abbr: 'FGS4' },
	{ tokenName: 'fgFill', abbr: 'FGF' },
	{ tokenName: 'fgFillInverted', abbr: 'FGFI' },
	{ tokenName: 'fgFillDark', abbr: 'FGFD' },
];

type RampTableProps = {
	ramps: {
		name: ThemeProviderColorRampName;
		seed: {
			name: keyof Ramp;
			value: string;
		};
		ramp: Record< keyof Ramp, string >;
	}[];
	warnings?: readonly ThemeProviderColorWarning[];
};

function hasRampWarning(
	warnings: readonly ThemeProviderColorWarning[],
	ramp: ThemeProviderColorRampName,
	step: keyof Ramp
) {
	return warnings.some(
		( warning ) =>
			warning.type === 'ramp' &&
			warning.ramp === ramp &&
			warning.step === step
	);
}

function getSemanticTokenAliases(
	ramp: ThemeProviderColorRampName,
	step: keyof Ramp
): readonly string[] {
	const rampPrefix = ramp === 'background' ? 'bg' : ramp;
	const primitiveToken = `${ rampPrefix }-${ step }`;

	return (
		colorTokenAliases[ primitiveToken as keyof typeof colorTokenAliases ] ??
		[]
	);
}

function hasContrastWarning(
	warnings: readonly ThemeProviderColorWarning[],
	ramp: ThemeProviderColorRampName,
	step: keyof Ramp
) {
	const semanticTokenAliases = getSemanticTokenAliases( ramp, step );

	return warnings.some(
		( warning ) =>
			warning.type === 'contrast' &&
			( semanticTokenAliases.includes(
				warning.foregroundToken.replaceAll( '.', '-' )
			) ||
				semanticTokenAliases.includes(
					warning.backgroundToken.replaceAll( '.', '-' )
				) )
	);
}

function hasColorWarningForStep(
	warnings: readonly ThemeProviderColorWarning[],
	ramp: ThemeProviderColorRampName,
	step: keyof Ramp
) {
	return (
		hasRampWarning( warnings, ramp, step ) ||
		hasContrastWarning( warnings, ramp, step )
	);
}

export function hasColorWarningForRamp(
	warnings: readonly ThemeProviderColorWarning[],
	ramp: ThemeProviderColorRampName
) {
	return RAMP_TOKENS_ORDER.some( ( { tokenName } ) =>
		hasColorWarningForStep( warnings, ramp, tokenName )
	);
}

function isSeedAdjusted( seed: string, generatedAnchor: string ) {
	return getColorString( seed ) !== getColorString( generatedAnchor );
}

export const RampTable = forwardRef< HTMLDivElement, RampTableProps >(
	function RampTable( { ramps, warnings = [] }, forwardedRef ) {
		const hasAdjustedSeed = ramps.some( ( { seed, ramp } ) =>
			isSeedAdjusted( seed.value, ramp[ seed.name ] )
		);
		const hasAnyColorWarning = warnings.length > 0;

		return (
			<div
				style={ { width: '100%', overflowX: 'scroll' } }
				ref={ forwardedRef }
			>
				{ hasAdjustedSeed || hasAnyColorWarning ? (
					<p style={ { marginBlock: '0 0.5rem' } }>
						<strong>Markers:</strong>{ ' ' }
						{ hasAnyColorWarning ? '! color warning' : null }
						{ hasAnyColorWarning && hasAdjustedSeed ? ' · ' : null }
						{ hasAdjustedSeed ? 'SEED ≠ generated anchor' : null }
					</p>
				) : null }
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns: `repeat(${ RAMP_TOKENS_ORDER.length }, minmax(max-content, 1fr))`,
						fontFamily: 'var(--wpds-typography-font-family-body)',
						alignItems: 'end',
					} }
				>
					{ RAMP_TOKENS_ORDER.map( ( { tokenName, abbr } ) => (
						<div
							key={ tokenName }
							style={ {
								textAlign: 'center',
								padding: '8px 4px',
								fontSize: 11,
								fontWeight:
									'var(--wpds-typography-font-weight-emphasis)',
								color: ramps[ 0 ].ramp.fgSurface4,
							} }
						>
							{ abbr }
						</div>
					) ) }
					{ ramps.map( ( { name, seed, ramp }, i ) =>
						RAMP_TOKENS_ORDER.map( ( { tokenName } ) => (
							<div
								key={ `${ name }-${ tokenName }` }
								title={
									hasColorWarningForStep(
										warnings,
										name,
										tokenName
									)
										? `${ name } ramp, ${ tokenName } step: color warning`
										: undefined
								}
								style={ {
									marginBlockStart: i !== 0 ? 4 : 0,
									backgroundColor: ramp[ tokenName ],
									display: 'grid',
									gridTemplateRows: '20px 1fr',
									placeItems: 'center',
									height: tokenName === seed.name ? 60 : 40,
									minWidth: 32,
									fontSize: 14,
									outline: hasColorWarningForStep(
										warnings,
										name,
										tokenName
									)
										? '3px solid #d63638'
										: '',
									outlineOffset: '-3px',
									boxShadow: hasColorWarningForStep(
										warnings,
										name,
										tokenName
									)
										? 'inset 0 0 0 6px #fff'
										: '',
									position: 'relative',
								} }
							>
								{ hasColorWarningForStep(
									warnings,
									name,
									tokenName
								) ? (
									<strong
										aria-hidden="true"
										style={ {
											background: '#d63638',
											color: '#fff',
											fontSize: 10,
											insetBlockStart: 0,
											insetInlineEnd: 0,
											lineHeight: 1,
											padding: 2,
											position: 'absolute',
										} }
									>
										!
									</strong>
								) : null }
								{ tokenName === seed.name ? (
									<div
										title={
											isSeedAdjusted(
												seed.value,
												ramp[ tokenName ]
											)
												? `${ name } input seed ${ seed.value }; generated ${ tokenName } anchor ${ ramp[ tokenName ] }`
												: undefined
										}
										style={ {
											backgroundColor: seed.value,
											height: 20,
											gridRowStart: 1,
											gridRowEnd: 2,
											display: 'grid',
											placeItems: 'center',
											width: '100%',
											fontSize: 8,
											fontWeight:
												'var(--wpds-typography-font-weight-emphasis)',
											outline: isSeedAdjusted(
												seed.value,
												ramp[ tokenName ]
											)
												? '3px dashed currentColor'
												: '',
											outlineOffset: '-3px',
											color:
												tokenName === 'surface2'
													? ramp.fgSurface4
													: ramp.fgFill,
										} }
									>
										{ isSeedAdjusted(
											seed.value,
											ramp[ tokenName ]
										)
											? 'SEED ≠'
											: 'SEED' }
									</div>
								) : null }
								{ [
									'surface3',
									'bgFill1',
									'bgFillInverted1',
									'bgFillDark',
								].includes( tokenName ) ? (
									<span
										style={ {
											padding: '2px 6px',
											display: 'flex',
											alignItems: 'center',
											gap: 2,
											gridRowStart:
												tokenName === seed.name ? 2 : 1,
											gridRowEnd: 3,
										} }
									>
										{ tokenName === 'surface3' ? (
											<>
												<span
													style={ {
														color: ramp.fgSurface1,
													} }
												>
													Aa
												</span>
												<span
													style={ {
														color: ramp.fgSurface2,
													} }
												>
													Aa
												</span>
												<span
													style={ {
														color: ramp.fgSurface3,
													} }
												>
													Aa
												</span>
												<span
													style={ {
														color: ramp.fgSurface4,
													} }
												>
													Aa
												</span>
											</>
										) : null }
										{ tokenName === 'bgFill1' ? (
											<span
												style={ {
													color: ramp.fgFill,
												} }
											>
												Aa
											</span>
										) : null }
										{ tokenName === 'bgFillInverted1' ? (
											<span
												style={ {
													color: ramp.fgFillInverted,
												} }
											>
												Aa
											</span>
										) : null }
										{ tokenName === 'bgFillDark' ? (
											<span
												style={ {
													color: ramp.fgFillDark,
												} }
											>
												Aa
											</span>
										) : null }
									</span>
								) : null }
							</div>
						) )
					) }
				</div>
			</div>
		);
	}
);
