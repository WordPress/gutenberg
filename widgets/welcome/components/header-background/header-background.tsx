/**
 * WordPress dependencies
 */
import { useId } from '@wordpress/element';
import {
	SVG,
	G,
	Path,
	Circle,
	Rect,
	Defs,
	LinearGradient,
	Stop,
} from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import styles from './header-background.module.css';

type StopSet = 'ring' | 'linear';

interface Stroke {
	d: string;
	// Gradient vector in local glyph coords; defaults to a diagonal across the glyph.
	vec?: [ number, number, number, number ];
	stops?: StopSet;
}

interface Glyph {
	advance: number;
	strokes?: Stroke[];
	circles?: { cx: number; cy: number; r: number }[];
}

/* Stylized version digits drawn with thick strokes, in the core About-banner
   style: each stroke carries its own gradient (sand -> blue -> near-black), so
   on the 6 and 9 the stem (drawn over the ring) meets the ring with a
   dark/light seam that reads as a folded ribbon. Glyphs are placed
   right-to-left so any version hugs the right edge; each is its own
   <g data-glyph> group so sectors can be decorated or animated later. */
const GLYPH_HEIGHT = 200;
const GLYPHS: Record< string, Glyph > = {
	'0': {
		advance: 150,
		strokes: [ { d: 'M76 30 a48 82 0 1 0 0 164 a48 82 0 1 0 0 -164 Z' } ],
	},
	'1': { advance: 110, strokes: [ { d: 'M30 56 L74 22 L74 202' } ] },
	'2': {
		advance: 150,
		strokes: [
			{ d: 'M34 66 A44 40 0 1 1 120 70 C120 112 38 152 30 196 L124 196' },
		],
	},
	'3': {
		advance: 150,
		strokes: [ { d: 'M34 54 A42 36 0 1 1 80 102 A50 48 0 1 1 30 174' } ],
	},
	'4': { advance: 150, strokes: [ { d: 'M106 196 V40 L28 138 H128' } ] },
	'5': {
		advance: 150,
		strokes: [ { d: 'M114 40 H58 L57 104 H74 A46 48 0 1 1 50 186' } ],
	},
	'6': {
		advance: 150,
		strokes: [
			{
				d: 'M28 143 a46 46 0 1 0 92 0 a46 46 0 1 0 -92 0',
				vec: [ -39, 156, 78, 39 ],
				stops: 'ring',
			},
			{ d: 'M117 34 L42 110', vec: [ 97, -18, -56, 135 ] },
		],
	},
	'7': { advance: 150, strokes: [ { d: 'M30 24 H128 L64 202' } ] },
	'8': {
		advance: 150,
		strokes: [
			{
				d: 'M76 26 a38 38 0 1 0 0 76 a38 38 0 1 0 0 -76',
				vec: [ 120, 16, 30, 200 ],
			},
			{
				d: 'M76 106 a46 46 0 1 0 0 92 a46 46 0 1 0 0 -92',
				vec: [ 120, 16, 30, 200 ],
			},
		],
	},
	'9': {
		advance: 150,
		strokes: [
			{
				d: 'M30 82 a46 46 0 1 0 92 0 a46 46 0 1 0 -92 0',
				vec: [ 190, 69, 73, 186 ],
				stops: 'ring',
			},
			{ d: 'M33 190 L109 115', vec: [ 54, 243, 207, 90 ] },
		],
	},
	'.': { advance: 80, circles: [ { cx: 40, cy: 178, r: 26 } ] },
};

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 300;
const RIGHT_MARGIN = 40;
const GLYPH_GAP = 2;
const GLYPH_TOP = ( VIEW_HEIGHT - GLYPH_HEIGHT ) / 2;

// Gradient stops, shared by all strokes; colors come from CSS tokens on .banner.
const STOP_SETS = {
	// Ring of the 6/9: light at the bottom, near-black where the stem lands.
	ring: [
		[ 'var(--banner-accent-warm)', 0 ],
		[ 'var(--banner-accent-brand)', 0.665 ],
		[ 'var(--banner-accent-dark)', 1 ],
	],
	// Stems and plain digits: near-black to light along the stroke.
	linear: [
		[ 'var(--banner-accent-dark)', 0 ],
		[ 'var(--banner-accent-brand)', 0.5 ],
		[ 'var(--banner-accent-warm)', 1 ],
	],
} as const;

interface HeaderBackgroundProps {
	version: string;
}

export function HeaderBackground( { version }: HeaderBackgroundProps ) {
	const idBase = useId();
	const maskId = `${ idBase }-glint-mask`;
	const glintId = `${ idBase }-glint`;

	// Place glyphs right-to-left so the version stays anchored to the right.
	const placed: { key: string; x: number; char: string; glyph: Glyph }[] = [];
	let cursor = VIEW_WIDTH - RIGHT_MARGIN;
	const chars = Array.from( version );
	for ( let i = chars.length - 1; i >= 0; i-- ) {
		const char = chars[ i ];
		if ( ! char ) {
			continue;
		}
		const glyph = GLYPHS[ char ];
		if ( ! glyph ) {
			continue;
		}
		const x = cursor - glyph.advance;
		placed.unshift( { key: `${ i }-${ char }`, x, char, glyph } );
		cursor = x - GLYPH_GAP;
	}

	const strokeId = ( glyphIndex: number, strokeIndex: number ) =>
		`${ idBase }-${ glyphIndex }-${ strokeIndex }`;

	/* Paint the placed glyphs. `forMask` swaps the gradients/fills for opaque
	   white so the same shapes can drive the glint mask. */
	const renderGlyphs = ( forMask: boolean ) =>
		placed.map( ( { key, x, char, glyph }, glyphIndex ) => (
			<G
				key={ key }
				data-glyph={ char }
				transform={ `translate(${ x } ${ GLYPH_TOP })` }
			>
				{ glyph.strokes?.map( ( stroke, strokeIndex ) => (
					<Path
						key={ strokeIndex }
						d={ stroke.d }
						stroke={
							forMask
								? 'white'
								: `url(#${ strokeId(
										glyphIndex,
										strokeIndex
								  ) })`
						}
					/>
				) ) }
				{ glyph.circles?.map( ( circle, circleIndex ) => (
					<Circle
						key={ circleIndex }
						cx={ circle.cx }
						cy={ circle.cy }
						r={ circle.r }
						fill={
							forMask ? 'white' : 'var(--banner-accent-brand)'
						}
					/>
				) ) }
			</G>
		) );

	return (
		<SVG
			className={ styles.root }
			preserveAspectRatio="xMaxYMid slice"
			fill="none"
			viewBox={ `0 0 ${ VIEW_WIDTH } ${ VIEW_HEIGHT }` }
			xmlns="http://www.w3.org/2000/svg"
		>
			<G
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="44"
			>
				{ renderGlyphs( false ) }
			</G>

			{ /* Slow specular sweep, clipped to the digits, so light grazes
			     the bevel as it travels. It rests off-screen (see CSS). */ }
			<G mask={ `url(#${ maskId })` }>
				<Rect
					className={ styles.glint }
					x="0"
					y="0"
					width="300"
					height={ VIEW_HEIGHT }
					fill={ `url(#${ glintId })` }
				/>
			</G>

			<Defs>
				{ placed.flatMap( ( { glyph }, glyphIndex ) =>
					( glyph.strokes ?? [] ).map( ( stroke, strokeIndex ) => {
						const [ x1, y1, x2, y2 ] = stroke.vec ?? [
							glyph.advance * 0.8,
							6,
							glyph.advance * 0.15,
							196,
						];
						return (
							<LinearGradient
								key={ `${ glyphIndex }-${ strokeIndex }` }
								id={ strokeId( glyphIndex, strokeIndex ) }
								gradientUnits="userSpaceOnUse"
								x1={ x1 }
								y1={ y1 }
								x2={ x2 }
								y2={ y2 }
							>
								{ STOP_SETS[ stroke.stops ?? 'linear' ].map(
									( [ color, offset ] ) => (
										<Stop
											key={ offset }
											offset={ offset }
											stopColor={ color }
										/>
									)
								) }
							</LinearGradient>
						);
					} )
				) }

				{ /* Narrow diagonal highlight band; rides the glint rect's box
				     so it tilts along with the bevel. */ }
				<LinearGradient id={ glintId } x1="0" y1="0" x2="1" y2="0.55">
					<Stop
						offset="0"
						stopColor="var(--banner-glint)"
						stopOpacity="0"
					/>
					<Stop
						offset="0.4"
						stopColor="var(--banner-glint)"
						stopOpacity="0"
					/>
					<Stop
						offset="0.5"
						stopColor="var(--banner-glint)"
						stopOpacity="0.65"
					/>
					<Stop
						offset="0.6"
						stopColor="var(--banner-glint)"
						stopOpacity="0"
					/>
					<Stop
						offset="1"
						stopColor="var(--banner-glint)"
						stopOpacity="0"
					/>
				</LinearGradient>

				<mask
					id={ maskId }
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width={ VIEW_WIDTH }
					height={ VIEW_HEIGHT }
				>
					<G
						fill="none"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="44"
					>
						{ renderGlyphs( true ) }
					</G>
				</mask>
			</Defs>
		</SVG>
	);
}
