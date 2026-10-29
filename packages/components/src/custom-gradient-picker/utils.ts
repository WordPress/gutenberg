import gradientParser from 'gradient-parser';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import {
	DEFAULT_GRADIENT,
	HORIZONTAL_GRADIENT_ORIENTATION,
	DIRECTIONAL_ORIENTATION_ANGLE_MAP,
} from './constants';
import { serializeGradient } from './serializer';
import type { ControlPoint } from './types';

extend( [ namesPlugin ] );

const ANGLE_UNIT_TO_DEGREES: Record< gradientParser.AngleUnit, number > = {
	deg: 1,
	rad: 180 / Math.PI,
	grad: 0.9,
	turn: 360,
};

export function getLinearGradientRepresentation(
	gradientAST: gradientParser.GradientNode
) {
	return serializeGradient( {
		type: 'linear-gradient',
		orientation: HORIZONTAL_GRADIENT_ORIENTATION,
		colorStops: gradientAST.colorStops,
	} );
}

function hasUnsupportedLength( item: gradientParser.ColorStop ) {
	return item.length === undefined || item.length.type !== '%';
}

export function getGradientAstWithDefault( value?: string | null ) {
	// gradientAST will contain the gradient AST as parsed by gradient-parser npm module.
	// More information of its structure available at https://www.npmjs.com/package/gradient-parser#ast.
	let gradientAST: gradientParser.GradientNode | undefined;
	let hasGradient = !! value;

	const valueToParse = value ?? DEFAULT_GRADIENT;

	try {
		gradientAST = gradientParser.parse( valueToParse )[ 0 ];
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			'wp.components.CustomGradientPicker failed to parse the gradient with error',
			error
		);
	}

	// The picker cannot preserve conic orientations or a second position per stop.
	// Keep these newly parsed forms on the existing unselected fallback path.
	if (
		! gradientAST ||
		gradientAST.type === 'conic-gradient' ||
		gradientAST.type === 'repeating-conic-gradient' ||
		gradientAST.colorStops.some( ( stop ) => stop.length2 !== undefined )
	) {
		gradientAST = gradientParser.parse( DEFAULT_GRADIENT )[ 0 ];
		hasGradient = false;
	}

	if (
		! Array.isArray( gradientAST.orientation ) &&
		gradientAST.orientation?.type === 'directional'
	) {
		const direction =
			gradientAST.orientation.value.toLowerCase() as keyof typeof DIRECTIONAL_ORIENTATION_ANGLE_MAP;
		gradientAST.orientation = {
			type: 'angular',
			value: DIRECTIONAL_ORIENTATION_ANGLE_MAP[ direction ].toString(),
			unit: 'deg',
		};
	}

	if (
		! Array.isArray( gradientAST.orientation ) &&
		gradientAST.orientation?.type === 'angular' &&
		gradientAST.orientation.unit !== 'deg'
	) {
		const { value: angle, unit } = gradientAST.orientation;
		gradientAST.orientation = {
			type: 'angular',
			value: `${ Number( angle ) * ANGLE_UNIT_TO_DEGREES[ unit ] }`,
			unit: 'deg',
		};
	}

	if ( gradientAST.colorStops.some( hasUnsupportedLength ) ) {
		const { colorStops } = gradientAST;
		const step = 100 / ( colorStops.length - 1 );
		colorStops.forEach( ( stop, index ) => {
			stop.length = {
				value: `${ step * index }`,
				type: '%',
			};
		} );
	}

	return { gradientAST, hasGradient };
}

export function getGradientAstWithControlPoints(
	gradientAST: gradientParser.GradientNode,
	newControlPoints: ControlPoint[]
) {
	return {
		...gradientAST,
		colorStops: newControlPoints.map( ( { position, color } ) => {
			const { r, g, b, a } = colord( color ).toRgb();
			return {
				length: {
					type: '%',
					value: position?.toString(),
				},
				type: a < 1 ? 'rgba' : 'rgb',
				value:
					a < 1
						? [ `${ r }`, `${ g }`, `${ b }`, `${ a }` ]
						: [ `${ r }`, `${ g }`, `${ b }` ],
			};
		} ),
	} as gradientParser.GradientNode;
}

export function getStopCssColor( colorStop: gradientParser.ColorStop ) {
	switch ( colorStop.type ) {
		case 'hex':
			return `#${ colorStop.value }`;
		case 'literal':
			return colorStop.value;
		case 'var':
			return `${ colorStop.type }(${ colorStop.value })`;
		case 'rgb':
		case 'rgba':
			return `${ colorStop.type }(${ colorStop.value.join( ',' ) })`;
		case 'hsl': {
			const [ hue, saturation, lightness ] = colorStop.value;
			return `hsl(${ hue },${ saturation }%,${ lightness }%)`;
		}
		case 'hsla': {
			const [ hue, saturation, lightness, alpha = '1' ] = colorStop.value;
			return `hsla(${ hue },${ saturation }%,${ lightness }%,${ alpha })`;
		}
		default:
			// Should be unreachable if passing an AST from gradient-parser.
			// See https://github.com/rafaelcaricio/gradient-parser#ast.
			return 'transparent';
	}
}
