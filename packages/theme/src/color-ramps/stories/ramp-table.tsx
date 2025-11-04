/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
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
		seed: {
			name: keyof Ramp;
			value: string;
		};
		ramp: Record<
			keyof Ramp,
			{
				color: string;
				warning: boolean;
			}
		>;
	}[];
};
export const RampTable = forwardRef< HTMLDivElement, RampTableProps >(
	function RampTable( { ramps }, forwardedRef ) {
		return (
			<div
				style={ { width: '100%', overflowX: 'scroll' } }
				ref={ forwardedRef }
			>
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns: `repeat(${ RAMP_TOKENS_ORDER.length }, minmax(max-content, 1fr))`,
						fontFamily: '-apple-system, "system-ui", sans-serif',
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
								fontWeight: 500,
								color: ramps[ 0 ].ramp.fgSurface4.color,
							} }
						>
							{ abbr }
						</div>
					) ) }
					{ ramps.map( ( { seed, ramp }, i ) =>
						RAMP_TOKENS_ORDER.map( ( { tokenName } ) => (
							<div
								key={ `${ seed }-${ i }-${ tokenName }` }
								style={ {
									marginBlockStart: i !== 0 ? 4 : 0,
									backgroundColor: ramp[ tokenName ].color,
									display: 'grid',
									gridTemplateRows: '20px 1fr',
									placeItems: 'center',
									height: tokenName === seed.name ? 60 : 40,
									minWidth: 32,
									fontSize: 14,
									outline: ramp[ tokenName ].warning
										? '2px solid red'
										: '',
									outlineOffset: '-2px',
								} }
							>
								{ tokenName === seed.name ? (
									<div
										style={ {
											backgroundColor: seed.value,
											height: 20,
											gridRowStart: 1,
											gridRowEnd: 2,
											display: 'grid',
											placeItems: 'center',
											width: '100%',
											fontSize: 8,
											fontWeight: 500,
											color:
												tokenName === 'surface2'
													? ramp.fgSurface4.color
													: ramp.fgFill.color,
										} }
									>
										SEED
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
														color: ramp.fgSurface1
															.color,
													} }
												>
													Aa
												</span>
												<span
													style={ {
														color: ramp.fgSurface2
															.color,
													} }
												>
													Aa
												</span>
												<span
													style={ {
														color: ramp.fgSurface3
															.color,
													} }
												>
													Aa
												</span>
												<span
													style={ {
														color: ramp.fgSurface4
															.color,
													} }
												>
													Aa
												</span>
											</>
										) : null }
										{ tokenName === 'bgFill1' ? (
											<span
												style={ {
													color: ramp.fgFill.color,
												} }
											>
												Aa
											</span>
										) : null }
										{ tokenName === 'bgFillInverted1' ? (
											<span
												style={ {
													color: ramp.fgFillInverted
														.color,
												} }
											>
												Aa
											</span>
										) : null }
										{ tokenName === 'bgFillDark' ? (
											<span
												style={ {
													color: ramp.fgFillDark
														.color,
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
