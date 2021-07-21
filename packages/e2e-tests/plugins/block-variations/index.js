( function () {
	const el = wp.element.createElement;
	const registerBlockVariation = wp.blocks.registerBlockVariation;
	const __ = wp.i18n.__;
	const Circle = wp.primitives.Circle;
	const SVG = wp.primitives.SVG;

	const redCircle = el( Circle, {
		cx: 24,
		cy: 24,
		r: 15,
		fill: 'red',
		stroke: 'blue',
		strokeWidth: '10',
	} );

	const redCircleIcon = el(
		SVG,
		{ width: 48, height: 48, viewBox: '0 0 48 48' },
		redCircle
	);

	registerBlockVariation( 'core/quote', {
		name: 'large',
		title: 'Large Quote',
		isDefault: true,
		attributes: { className: 'is-style-large' },
		icon: 'format-quote',
		scope: [ 'inserter' ],
	} );

	registerBlockVariation( 'core/paragraph', {
		name: 'success',
		title: __( 'Success Message' ),
		description:
			'This block displays a success message. This description overrides the default one provided for the Paragraph block.',
		attributes: {
			content: 'This is a success message!',
			backgroundColor: 'vivid-green-cyan',
			dropCap: false,
		},
		icon: 'yes-alt',
		scope: [ 'inserter' ],
		isActive: ( { backgroundColor }, variationAttributes ) =>
			backgroundColor === variationAttributes.backgroundColor,
	} );

	registerBlockVariation( 'core/paragraph', {
		name: 'warning',
		title: __( 'Warning Message' ),
		attributes: {
			content: 'This is a warning message!',
			backgroundColor: 'luminous-vivid-amber',
			dropCap: false,
		},
		icon: 'warning',
		scope: [ 'inserter' ],
		isActive: ( { backgroundColor }, variationAttributes ) =>
			backgroundColor === variationAttributes.backgroundColor,
	} );

	registerBlockVariation( 'core/columns', {
		name: 'four-columns',
		title: 'Four columns',
		innerBlocks: [
			[ 'core/column' ],
			[ 'core/column' ],
			[ 'core/column' ],
			[ 'core/column' ],
		],
		icon: redCircleIcon,
		scope: [ 'block' ],
	} );
} )();
