( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const el = wp.element.createElement;
	const InnerBlocks = wp.blockEditor.InnerBlocks;
	const circle = el( 'circle', {
		cx: 10,
		cy: 10,
		r: 10,
		fill: 'red',
		stroke: 'blue',
		strokeWidth: '10',
	} );
	const svg = el(
		'svg',
		{ width: 20, height: 20, viewBox: '0 0 20 20' },
		circle
	);

	registerBlockType( 'test/test-single-svg-icon', {
		title: 'TestSimpleSvgIcon',
		icon: svg,
		category: 'text',

		edit() {
			return el(
				'div',
				{
					className: 'test-single-svg-icon',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks, {
					allowedBlocks: [ 'core/paragraph', 'core/image' ],
					template: [
						[
							'core/paragraph',
							{
								content: 'TestSimpleSvgIcon',
							},
						],
					],
				} )
			);
		},

		save() {
			return el(
				'div',
				{
					className: 'test-single-svg-icon',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks.Content, {} )
			);
		},
	} );

	registerBlockType( 'test/test-dash-icon', {
		title: 'TestSimpleDashIcon',
		icon: 'cart',
		category: 'text',

		edit() {
			return el(
				'div',
				{
					className: 'test-dash-icon',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks, {
					allowedBlocks: [ 'core/paragraph', 'core/image' ],
					template: [
						[
							'core/paragraph',
							{
								content: 'TestDashIcon',
							},
						],
					],
				} )
			);
		},

		save() {
			return el(
				'div',
				{
					className: 'test-dash-icon',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks.Content, {} )
			);
		},
	} );

	registerBlockType( 'test/test-function-icon', {
		title: 'TestFunctionIcon',
		icon() {
			return svg;
		},
		category: 'text',

		edit() {
			return el(
				'div',
				{
					className: 'test-function-icon',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks, {
					allowedBlocks: [ 'core/paragraph', 'core/image' ],
					template: [
						[
							'core/paragraph',
							{
								content: 'TestFunctionIcon',
							},
						],
					],
				} )
			);
		},

		save() {
			return el(
				'div',
				{
					className: 'test-function-icon',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks.Content, {} )
			);
		},
	} );

	registerBlockType( 'test/test-dash-icon-colors', {
		title: 'TestDashIconColors',
		icon: {
			background: '#010000',
			foreground: '#fe0000',
			src: 'cart',
		},
		category: 'text',

		edit() {
			return el(
				'div',
				{
					className: 'test-dash-icon-colors',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks, {
					allowedBlocks: [ 'core/paragraph', 'core/image' ],
					template: [
						[
							'core/paragraph',
							{
								content: 'TestIconColors',
							},
						],
					],
				} )
			);
		},

		save() {
			return el(
				'div',
				{
					className: 'test-dash-icon-colors',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks.Content, {} )
			);
		},
	} );

	registerBlockType( 'test/test-svg-icon-background', {
		title: 'TestSvgIconBackground',
		icon: {
			background: '#010000',
			src: svg,
		},
		category: 'text',

		edit() {
			return el(
				'div',
				{
					className: 'test-svg-icon-background',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks, {
					allowedBlocks: [ 'core/paragraph', 'core/image' ],
					template: [
						[
							'core/paragraph',
							{
								content: 'TestIconColors',
							},
						],
					],
				} )
			);
		},

		save() {
			return el(
				'div',
				{
					className: 'test-svg-icon-background',
					style: { outline: '1px solid gray', padding: 5 },
				},
				el( InnerBlocks.Content, {} )
			);
		},
	} );
} )();
