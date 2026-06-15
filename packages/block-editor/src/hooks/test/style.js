/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import _style, {
	getCanvasStateStyleValue,
	getBlockStateStylesCSS,
	getInlineStyles,
	getResponsiveStateCSSRules,
	getStateStylesCSS,
	omitStyle,
} from '../style';

describe( 'getInlineStyles', () => {
	it( 'should return an empty object when called with undefined', () => {
		expect( getInlineStyles() ).toEqual( {} );
	} );

	it( 'should ignore unknown styles', () => {
		expect( getInlineStyles( { color: 'red' } ) ).toEqual( {} );
	} );

	it( 'should return the correct inline styles', () => {
		expect(
			getInlineStyles( {
				color: { text: 'red', background: 'black' },
				typography: { lineHeight: 1.5, fontSize: 10, textColumns: 2 },
				border: {
					radius: '10px',
					width: '1em',
					style: 'dotted',
					color: '#21759b',
				},
				dimensions: {
					minHeight: '50vh',
					minWidth: '200px',
				},
				spacing: {
					blockGap: '1em',
					padding: { top: '10px' },
					margin: { bottom: '15px' },
				},
			} )
		).toEqual( {
			backgroundColor: 'black',
			borderColor: '#21759b',
			borderRadius: '10px',
			borderStyle: 'dotted',
			borderWidth: '1em',
			color: 'red',
			columnCount: 2,
			lineHeight: 1.5,
			fontSize: 10,
			marginBottom: '15px',
			minHeight: '50vh',
			minWidth: '200px',
			paddingTop: '10px',
		} );
	} );

	it( 'should return individual border radius styles', () => {
		expect(
			getInlineStyles( {
				border: {
					radius: {
						topLeft: '10px',
						topRight: '0.5rem',
						bottomLeft: '0.5em',
						bottomRight: '1em',
					},
				},
			} )
		).toEqual( {
			borderTopLeftRadius: '10px',
			borderTopRightRadius: '0.5rem',
			borderBottomLeftRadius: '0.5em',
			borderBottomRightRadius: '1em',
		} );
	} );

	it( 'should support longhand spacing styles', () => {
		expect(
			getInlineStyles( {
				spacing: {
					margin: {
						top: '10px',
						right: '0.5rem',
						bottom: '0.5em',
						left: '1em',
					},
					padding: {
						top: '20px',
						right: '25px',
						bottom: '30px',
						left: '35px',
					},
				},
			} )
		).toEqual( {
			marginTop: '10px',
			marginRight: '0.5rem',
			marginBottom: '0.5em',
			marginLeft: '1em',
			paddingTop: '20px',
			paddingRight: '25px',
			paddingBottom: '30px',
			paddingLeft: '35px',
		} );
	} );

	it( 'should support shorthand spacing styles', () => {
		expect(
			getInlineStyles( {
				spacing: {
					blockGap: '1em',
					margin: '10px',
					padding: '20px',
				},
			} )
		).toEqual( {
			margin: '10px',
			padding: '20px',
		} );
	} );
} );

describe( 'getStateStylesCSS', () => {
	it( 'adds fallback border style without important', () => {
		expect(
			getStateStylesCSS(
				{
					border: {
						color: '#000000',
						width: '2px',
					},
				},
				'.wp-block-test:hover'
			)
		).toBe(
			'.wp-block-test:hover { border-color: #000000 !important; border-width: 2px !important; }\n.wp-block-test:hover { border-style: solid; }'
		);
	} );

	it( 'adds important to authored border style', () => {
		expect(
			getStateStylesCSS(
				{
					border: {
						style: 'solid',
					},
				},
				'.wp-block-test:hover'
			)
		).toBe( '.wp-block-test:hover { border-style: solid !important; }' );
	} );

	it( 'adds important to authored side border style', () => {
		expect(
			getStateStylesCSS(
				{
					border: {
						top: {
							style: 'dashed',
						},
					},
				},
				'.wp-block-test:hover'
			)
		).toBe(
			'.wp-block-test:hover { border-top-style: dashed !important; }'
		);
	} );

	it( 'adds fallback side border style without important', () => {
		expect(
			getStateStylesCSS(
				{
					border: {
						top: {
							width: '2px',
						},
					},
				},
				'.wp-block-test:hover'
			)
		).toBe(
			'.wp-block-test:hover { border-top-width: 2px !important; }\n.wp-block-test:hover { border-top-style: solid; }'
		);
	} );

	it( 'adds important to side border color', () => {
		expect(
			getStateStylesCSS(
				{
					border: {
						top: {
							color: '#0000ff',
						},
					},
				},
				'.wp-block-test:hover'
			)
		).toBe(
			'.wp-block-test:hover { border-top-color: #0000ff !important; }\n.wp-block-test:hover { border-top-style: solid; }'
		);
	} );

	it( 'adds background-image reset when state sets solid background-color', () => {
		expect(
			getStateStylesCSS(
				{
					color: {
						background: '#ff0000',
					},
				},
				'.wp-block-test:hover'
			)
		).toBe(
			'.wp-block-test:hover { background-color: #ff0000 !important; }\n.wp-block-test:hover { background-image: unset !important; }'
		);
	} );

	it( 'does not add background-image reset when state also sets a legacy gradient', () => {
		expect(
			getStateStylesCSS(
				{
					color: {
						background: '#ff0000',
						gradient: 'linear-gradient(135deg, #ff0000, #0000ff)',
					},
				},
				'.wp-block-test:hover'
			)
		).toBe(
			'.wp-block-test:hover { background: linear-gradient(135deg, #ff0000, #0000ff) !important; background-color: #ff0000 !important; }'
		);
	} );

	it( 'does not add background-image reset when state also sets a modern gradient', () => {
		expect(
			getStateStylesCSS(
				{
					color: {
						background: '#ff0000',
					},
					background: {
						gradient: 'linear-gradient(135deg, #ff0000, #0000ff)',
					},
				},
				'.wp-block-test:hover'
			)
		).toBe(
			'.wp-block-test:hover { background-color: #ff0000 !important; background-image: linear-gradient(135deg, #ff0000, #0000ff) !important; }'
		);
	} );

	it( 'adds important fallback dimensions when aspect ratio is set', () => {
		expect(
			getStateStylesCSS(
				{
					dimensions: {
						aspectRatio: '16/9',
					},
				},
				'.wp-block-test'
			)
		).toBe(
			'.wp-block-test { height: unset !important; min-height: unset !important; aspect-ratio: 16/9 !important; }'
		);
	} );

	it( 'does not add fallback dimensions when aspect ratio is the default', () => {
		expect(
			getStateStylesCSS(
				{
					dimensions: {
						aspectRatio: 'auto',
					},
				},
				'.wp-block-test'
			)
		).toBe( '.wp-block-test { aspect-ratio: auto !important; }' );
	} );

	it( 'adds important fallback aspect ratio when height is set', () => {
		expect(
			getStateStylesCSS(
				{
					dimensions: {
						height: '20rem',
					},
				},
				'.wp-block-test'
			)
		).toBe(
			'.wp-block-test { height: 20rem !important; aspect-ratio: unset !important; }'
		);
	} );
} );

describe( 'getBlockStateStylesCSS', () => {
	beforeEach( () => {
		registerBlockType( 'test/state-button', {
			apiVersion: 3,
			title: 'State Button',
			category: 'text',
			attributes: {},
			edit: () => null,
			save: () => null,
			selectors: {
				root: '.wp-block-button .wp-block-button__link',
				dimensions: {
					root: '.wp-block-button',
					width: '.wp-block-button',
				},
			},
		} );
	} );

	afterEach( () => {
		unregisterBlockType( 'test/state-button' );
	} );

	it( 'routes state styles through feature selectors', () => {
		expect(
			getBlockStateStylesCSS(
				{
					color: { background: '#ff00d0' },
					dimensions: { width: '50%' },
				},
				{
					name: 'test/state-button',
					baseSelector: '.wp-elements-abc123',
					state: ':hover',
				}
			)
		).toBe(
			'.wp-elements-abc123 .wp-block-button__link:hover { background-color: #ff00d0 !important; }\n.wp-elements-abc123 .wp-block-button__link:hover { background-image: unset !important; }\n.wp-elements-abc123:hover { width: 50% !important; }'
		);
	} );

	it( 'routes canvas preview styles through feature selectors without the pseudo state', () => {
		expect(
			getBlockStateStylesCSS(
				{
					color: { background: '#ff00d0' },
					dimensions: { width: '50%' },
				},
				{
					name: 'test/state-button',
					baseSelector: '[data-block="client-id"]',
				}
			)
		).toBe(
			'[data-block="client-id"] .wp-block-button__link { background-color: #ff00d0 !important; }\n[data-block="client-id"] .wp-block-button__link { background-image: unset !important; }\n[data-block="client-id"] { width: 50% !important; }'
		);
	} );
} );

describe( 'getResponsiveStateCSSRules', () => {
	beforeEach( () => {
		registerBlockType( 'test/state-button', {
			apiVersion: 3,
			title: 'State Button',
			category: 'text',
			attributes: {},
			edit: () => null,
			save: () => null,
			selectors: {
				root: '.wp-block-button .wp-block-button__link',
				dimensions: {
					root: '.wp-block-button',
					width: '.wp-block-button',
				},
			},
		} );

		registerBlockType( 'test/state-image', {
			apiVersion: 3,
			title: 'State Image',
			category: 'media',
			attributes: {},
			edit: () => null,
			save: () => null,
			selectors: {
				root: '.wp-block-test-state-image',
				dimensions: '.wp-block-test-state-image img',
			},
		} );
	} );

	afterEach( () => {
		unregisterBlockType( 'test/state-button' );
		unregisterBlockType( 'test/state-image' );
	} );

	it( 'generates media-query scoped root styles for viewport states', () => {
		expect(
			getResponsiveStateCSSRules(
				{
					mobile: {
						color: { text: 'red' },
					},
				},
				'core/paragraph',
				'.wp-elements-1'
			)
		).toEqual( [
			'@media (width <= 480px){.wp-elements-1 { color: red !important; }}',
		] );
	} );

	it( 'routes viewport styles through feature selectors', () => {
		expect(
			getResponsiveStateCSSRules(
				{
					mobile: {
						color: { background: '#ff00d0' },
						dimensions: { width: '50%' },
					},
				},
				'test/state-button',
				'.wp-elements-1'
			)
		).toEqual( [
			'@media (width <= 480px){.wp-elements-1 .wp-block-button__link { background-color: #ff00d0 !important; }\n.wp-elements-1 .wp-block-button__link { background-image: unset !important; }\n.wp-elements-1 { width: 50% !important; }}',
		] );
	} );

	it( 'outputs explicit fill object fit for viewport states', () => {
		expect(
			getResponsiveStateCSSRules(
				{
					mobile: {
						dimensions: { objectFit: 'fill' },
					},
				},
				'test/state-image',
				'.wp-elements-1'
			)
		).toEqual( [
			'@media (width <= 480px){.wp-elements-1 img { object-fit: fill !important; }}',
		] );
	} );

	it( 'generates media-query scoped pseudo styles for viewport states', () => {
		expect(
			getResponsiveStateCSSRules(
				{
					mobile: {
						':hover': {
							color: { background: 'black' },
						},
					},
				},
				'core/button',
				'.wp-elements-1'
			)
		).toEqual( [
			'@media (width <= 480px){.wp-elements-1:hover { background-color: black !important; }\n.wp-elements-1:hover { background-image: unset !important; }}',
		] );
	} );

	it( 'generates media-query scoped element styles for viewport states', () => {
		expect(
			getResponsiveStateCSSRules(
				{
					mobile: {
						elements: {
							link: {
								color: { text: 'blue' },
							},
						},
					},
				},
				'core/paragraph',
				'.wp-elements-1'
			)
		).toEqual( [
			'@media (width <= 480px){.wp-elements-1 a:where(:not(.wp-element-button)) { color: blue; }}',
		] );
	} );
} );

describe( 'getCanvasStateStyleValue', () => {
	it( 'returns the selected pseudo state value without a viewport state', () => {
		expect(
			getCanvasStateStyleValue(
				{
					':hover': {
						color: { text: 'red' },
					},
				},
				{ viewport: 'default', pseudo: ':hover' }
			)
		).toEqual( {
			color: { text: 'red' },
		} );
	} );

	it( 'falls back to default viewport pseudo styles for responsive pseudo states', () => {
		expect(
			getCanvasStateStyleValue(
				{
					':hover': {
						color: { text: 'red' },
					},
				},
				{ viewport: 'mobile', pseudo: ':hover' }
			)
		).toEqual( {
			color: { text: 'red' },
		} );
	} );

	it( 'merges responsive pseudo styles over default viewport pseudo styles', () => {
		expect(
			getCanvasStateStyleValue(
				{
					':hover': {
						color: { background: 'blue', text: 'red' },
					},
					mobile: {
						':hover': {
							color: { text: 'yellow' },
						},
					},
				},
				{ viewport: 'mobile', pseudo: ':hover' }
			)
		).toEqual( {
			color: { background: 'blue', text: 'yellow' },
		} );
	} );
} );

describe( 'addSaveProps', () => {
	const blockSettings = {
		save: () => <div className="default" />,
		category: 'text',
		title: 'block title',
		supports: {
			spacing: { padding: true },
			color: { gradients: true, text: true },
			typography: {
				fontSize: true,
				__experimentalTextTransform: true,
				__experimentalTextDecoration: true,
			},
		},
	};

	const applySkipSerialization = ( features ) => {
		const updatedSettings = { ...blockSettings };
		Object.keys( features ).forEach( ( key ) => {
			updatedSettings.supports[ key ].__experimentalSkipSerialization =
				features[ key ];
		} );
		return updatedSettings;
	};

	const attributes = {
		style: {
			color: {
				text: '#d92828',
				gradient:
					'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(223,13,13) 46%,rgb(155,81,224) 100%)',
			},
			spacing: { padding: '10px' },
			typography: {
				fontSize: '1rem',
				textDecoration: 'underline',
				textTransform: 'uppercase',
			},
		},
	};

	it( 'should serialize all styles by default', () => {
		const extraProps = _style.addSaveProps( {}, blockSettings, attributes );

		expect( extraProps.style ).toEqual( {
			background:
				'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(223,13,13) 46%,rgb(155,81,224) 100%)',
			color: '#d92828',
			padding: '10px',
			fontSize: '1rem',
			textDecoration: 'underline',
			textTransform: 'uppercase',
		} );
	} );

	it( 'should skip serialization of entire feature set if flag is true', () => {
		const settings = applySkipSerialization( {
			typography: true,
		} );
		const extraProps = _style.addSaveProps( {}, settings, attributes );

		expect( extraProps.style ).toEqual( {
			background:
				'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(223,13,13) 46%,rgb(155,81,224) 100%)',
			color: '#d92828',
			padding: '10px',
		} );
	} );

	it( 'should skip serialization of individual features if flag is an array', () => {
		const settings = applySkipSerialization( {
			color: [ 'gradient' ],
			typography: [ 'textDecoration', 'textTransform' ],
		} );
		const extraProps = _style.addSaveProps( {}, settings, attributes );

		expect( extraProps.style ).toEqual( {
			color: '#d92828',
			padding: '10px',
			fontSize: '1rem',
		} );
	} );
} );

describe( 'omitStyle', () => {
	it( 'should remove a single path', () => {
		const style = { color: '#d92828', padding: '10px' };
		const path = 'color';
		const expected = { padding: '10px' };

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should remove multiple paths', () => {
		const style = { color: '#d92828', padding: '10px', background: 'red' };
		const path = [ 'color', 'background' ];
		const expected = { padding: '10px' };

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should remove nested paths when specified as a string', () => {
		const style = {
			color: {
				text: '#d92828',
			},
			typography: {
				textDecoration: 'underline',
				textTransform: 'uppercase',
			},
		};
		const path = 'typography.textTransform';
		const expected = {
			color: {
				text: '#d92828',
			},
			typography: {
				textDecoration: 'underline',
			},
		};

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should remove nested paths when specified as an array', () => {
		const style = {
			color: {
				text: '#d92828',
			},
			typography: {
				textDecoration: 'underline',
				textTransform: 'uppercase',
			},
		};
		const path = [ [ 'typography', 'textTransform' ] ];
		const expected = {
			color: {
				text: '#d92828',
			},
			typography: {
				textDecoration: 'underline',
			},
		};

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should remove multiple nested paths', () => {
		const style = {
			color: {
				text: '#d92828',
			},
			typography: {
				textDecoration: 'underline',
				textTransform: 'uppercase',
			},
		};
		const path = [
			[ 'typography', 'textTransform' ],
			'typography.textDecoration',
		];
		const expected = {
			color: {
				text: '#d92828',
			},
			typography: {},
		};

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should remove paths with different nesting', () => {
		const style = {
			color: {
				text: '#d92828',
			},
			typography: {
				textDecoration: 'underline',
				textTransform: 'uppercase',
			},
		};
		const path = [
			'color',
			[ 'typography', 'textTransform' ],
			'typography.textDecoration',
		];
		const expected = {
			typography: {},
		};

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should support beyond 2 levels of nesting when passed as a single string', () => {
		const style = {
			border: {
				radius: {
					topLeft: '10px',
					topRight: '0.5rem',
				},
			},
		};
		const path = 'border.radius.topRight';
		const expected = {
			border: {
				radius: {
					topLeft: '10px',
				},
			},
		};

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should support beyond 2 levels of nesting when passed as array of strings', () => {
		const style = {
			border: {
				radius: {
					topLeft: '10px',
					topRight: '0.5rem',
				},
			},
		};
		const path = [ 'border.radius.topRight' ];
		const expected = {
			border: {
				radius: {
					topLeft: '10px',
				},
			},
		};

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should support beyond 2 levels of nesting when passed as array of arrays', () => {
		const style = {
			border: {
				radius: {
					topLeft: '10px',
					topRight: '0.5rem',
				},
			},
		};
		const path = [ [ 'border', 'radius', 'topRight' ] ];
		const expected = {
			border: {
				radius: {
					topLeft: '10px',
				},
			},
		};

		expect( omitStyle( style, path ) ).toEqual( expected );
	} );

	it( 'should ignore a nullish style object', () => {
		expect( omitStyle( undefined, 'color' ) ).toEqual( undefined );
		expect( omitStyle( null, 'color' ) ).toEqual( null );
	} );

	it( 'should ignore a missing object property', () => {
		const style1 = { typography: {} };
		expect( omitStyle( style1, 'color' ) ).toEqual( style1 );

		const style2 = { color: { text: '#d92828' } };
		expect( omitStyle( style2, 'color.something' ) ).toEqual( style2 );

		const style3 = {
			border: {
				radius: {
					topLeft: '10px',
					topRight: '0.5rem',
				},
			},
		};
		expect(
			omitStyle( style3, [ [ 'border', 'radius', 'bottomLeft' ] ] )
		).toEqual( style3 );
	} );

	it( 'should ignore an empty array path', () => {
		const style = { typography: {}, '': 'test' };

		expect( omitStyle( style, [] ) ).toEqual( style );
		expect( omitStyle( style, [ [] ] ) ).toEqual( style );
	} );
} );
