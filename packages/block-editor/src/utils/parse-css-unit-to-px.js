const PIXELS_PER_INCH = 96;
const ONE_PERCENT = 0.01;

const defaults = {
	ch: 8,
	ex: 7.15625,
	em: 16,
	rem: 16,
	in: PIXELS_PER_INCH,
	cm: PIXELS_PER_INCH / 2.54,
	mm: PIXELS_PER_INCH / 25.4,
	pt: PIXELS_PER_INCH / 72,
	pc: PIXELS_PER_INCH / 6,
	px: 1,
};

function parseUnit( cssUnit ) {
	const match = cssUnit
		.trim()
		.match(
			/^(0?[-.]?\d+)(r?e[m|x]|v[h|w|min|max]+|p[x|t|c]|[c|m]m|%|in|ch)$/
		);
	return match
		? { value: parseFloat( match[ 1 ] ) || match[ 1 ], unit: match[ 2 ] }
		: { value: null, unit: undefined };
}

function parseUnitFunction( cssUnit ) {
	// var regExp = /[min\(|max\(]([^()]*)\)/g;
	// var matches = regExp.exec(cssUnit);
	// let args = cssUnit.split( '/([(,),,])/' );
	// const firstChunk = args[0].split( '(');
	// args[0] = firstChunk[1];
	// const lastChunk = args[args.length - 1 ].split(')');
	// args[args.length - 1 ] = args[args.length - 1 ].split(')')[0];

	const functionUnit = cssUnit.split( /[(),]/g ).filter( Boolean );
	const units = functionUnit
		.slice( 1 )
		.map( ( unit ) => parseUnit( getPxFromCssUnit( unit ) ).value )
		.filter( Boolean );

	switch ( functionUnit[ 0 ] ) {
		case 'min':
			return { value: Math.min( ...units ), unit: 'px' };
		case 'max':
			return { value: Math.max( ...units ), unit: 'px' };
	}
	return null;
}

export function getPxFromCssUnit( cssUnit, options = {} ) {
	let parsedUnit = parseUnit( cssUnit );

	if ( ! parsedUnit.unit ) {
		parsedUnit = parseUnitFunction( cssUnit );
	}

	const defaultProperties = {
		fontSize: 16,
		width: 375,
		height: 812,
		type: 'font',
	};

	const setOptions = Object.assign( {}, defaultProperties, options );

	const relativeUnits = {
		em: setOptions.fontSize,
		rem: setOptions.fontSize,
		vh: setOptions.height * ONE_PERCENT,
		vw: setOptions.width * ONE_PERCENT,
		vmin:
			( setOptions.width < setOptions.height
				? setOptions.width
				: setOptions.height ) * ONE_PERCENT,
		vmax:
			( setOptions.width > setOptions.height
				? setOptions.width
				: setOptions.height ) * ONE_PERCENT,
		'%':
			( setOptions.type === 'font'
				? setOptions.fontSize
				: setOptions.width ) * ONE_PERCENT,
	};

	if ( relativeUnits[ parsedUnit.unit ] ) {
		return (
			( relativeUnits[ parsedUnit.unit ] * parsedUnit.value ).toFixed(
				0
			) + 'px'
		);
	}

	if ( defaults[ parsedUnit.unit ] ) {
		return (
			( defaults[ parsedUnit.unit ] * parsedUnit.value ).toFixed( 0 ) +
			'px'
		);
	}

	return null;
}
