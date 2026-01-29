/**
 * Internal dependencies
 */
import { getCSSRules, compileCSS } from '../index';

describe( 'generate', () => {
	it( 'should generate empty style', () => {
		expect( compileCSS( {}, '.some-selector' ) ).toEqual( '' );
	} );

	it( 'should generate empty style with empty keys', () => {
		expect(
			compileCSS( {
				spacing: undefined,
				color: undefined,
			} )
		).toEqual( '' );
	} );

	it( 'should generate inline styles where there is no selector', () => {
		expect(
			compileCSS( {
				spacing: { padding: '10px', margin: '12px' },
				color: {
					text: '#f1f1f1',
					background: '#222222',
					gradient:
						'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(143,47,47) 49%,rgb(155,81,224) 100%)',
				},
			} )
		).toEqual(
			'color: #f1f1f1; background: linear-gradient(135deg,rgb(6,147,227) 0%,rgb(143,47,47) 49%,rgb(155,81,224) 100%); background-color: #222222; margin: 12px; padding: 10px;'
		);
	} );

	it( 'should generate styles with an optional selector', () => {
		expect(
			compileCSS(
				{
					spacing: { padding: '10px', margin: '12px' },
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( '.some-selector { margin: 12px; padding: 10px; }' );

		expect(
			compileCSS(
				{
					color: {
						text: '#cccccc',
						background: '#111111',
						gradient:
							'linear-gradient(135deg,rgb(255,203,112) 0%,rgb(33,32,33) 42%,rgb(65,88,208) 100%)',
					},
					dimensions: {
						minHeight: '50vh',
					},
					spacing: {
						padding: { top: '10px', bottom: '5px' },
						margin: {
							top: '11px',
							right: '12px',
							bottom: '13px',
							left: '14px',
						},
					},
					typography: {
						fontSize: '2.2rem',
						fontStyle: 'italic',
						fontWeight: '800',
						fontFamily: "'Helvetica Neue',sans-serif",
						lineHeight: '3.3',
						textColumns: '2',
						textDecoration: 'line-through',
						letterSpacing: '12px',
						textTransform: 'uppercase',
					},
					outline: {
						offset: '2px',
						width: '4px',
						style: 'dashed',
						color: 'red',
					},
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual(
			".some-selector { color: #cccccc; background: linear-gradient(135deg,rgb(255,203,112) 0%,rgb(33,32,33) 42%,rgb(65,88,208) 100%); background-color: #111111; min-height: 50vh; outline-color: red; outline-style: dashed; outline-offset: 2px; outline-width: 4px; margin-top: 11px; margin-right: 12px; margin-bottom: 13px; margin-left: 14px; padding-top: 10px; padding-bottom: 5px; font-family: 'Helvetica Neue',sans-serif; font-size: 2.2rem; font-style: italic; font-weight: 800; letter-spacing: 12px; line-height: 3.3; column-count: 2; text-decoration: line-through; text-transform: uppercase; }"
		);
	} );

	it( 'should parse preset values', () => {
		expect(
			compileCSS( {
				color: {
					text: 'var:preset|color|ham-sandwich',
				},
				spacing: { margin: '3px' },
			} )
		).toEqual(
			'color: var(--wp--preset--color--ham-sandwich); margin: 3px;'
		);
	} );

	it( 'should parse preset values and kebab-case the slug', () => {
		expect(
			compileCSS( {
				color: {
					text: 'var:preset|font-size|h1',
				},
				spacing: { margin: { top: 'var:preset|spacing|3XL' } },
			} )
		).toEqual(
			'color: var(--wp--preset--font-size--h-1); margin-top: var(--wp--preset--spacing--3-xl);'
		);
	} );

	it( 'should parse border rules', () => {
		expect(
			compileCSS( {
				border: {
					color: 'var:preset|color|perky-peppermint',
					width: '0.5em',
					style: 'dotted',
					radius: '11px',
				},
			} )
		).toEqual(
			'border-color: var(--wp--preset--color--perky-peppermint); border-style: dotted; border-width: 0.5em; border-radius: 11px;'
		);
	} );

	it( 'should parse individual border rules', () => {
		expect(
			compileCSS( {
				border: {
					top: {
						color: 'var:preset|color|sandy-beach',
						width: '9px',
						style: 'dashed',
					},
					right: {
						color: 'var:preset|color|leafy-avenue',
						width: '5rem',
					},
					bottom: {
						color: '#eee',
						width: '2%',
						style: 'solid',
					},
					left: {
						color: 'var:preset|color|avocado-blues',
						width: '100px',
						style: 'dotted',
					},
					radius: {
						topLeft: '1px',
						topRight: '2px',
						bottomLeft: '3px',
						bottomRight: '4px',
					},
				},
			} )
		).toEqual(
			'border-top-left-radius: 1px; border-top-right-radius: 2px; border-bottom-left-radius: 3px; border-bottom-right-radius: 4px; border-top-color: var(--wp--preset--color--sandy-beach); border-top-style: dashed; border-top-width: 9px; border-right-color: var(--wp--preset--color--leafy-avenue); border-right-width: 5rem; border-bottom-color: #eee; border-bottom-style: solid; border-bottom-width: 2%; border-left-color: var(--wp--preset--color--avocado-blues); border-left-style: dotted; border-left-width: 100px;'
		);
	} );
} );

describe( 'getCSSRules', () => {
	it( 'should return an empty rules array', () => {
		expect( getCSSRules( {}, '.some-selector' ) ).toEqual( [] );
	} );

	it( 'should ignore unsupported styles', () => {
		expect(
			getCSSRules(
				{
					typography: {
						fontVariantLigatures: 'no-common-ligatures',
					},
					spacing: { padding: '10px' },
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( [
			{
				selector: '.some-selector',
				key: 'padding',
				value: '10px',
			},
		] );
	} );

	it( 'should return a rules array with CSS keys formatted in camelCase', () => {
		expect(
			getCSSRules(
				{
					spacing: { padding: '10px', margin: '12px' },
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( [
			{
				selector: '.some-selector',
				key: 'margin',
				value: '12px',
			},
			{
				selector: '.some-selector',
				key: 'padding',
				value: '10px',
			},
		] );

		expect(
			getCSSRules(
				{
					background: {
						backgroundImage: {
							url: 'https://example.com/image.jpg',
						},
						backgroundPosition: '50% 50%',
						backgroundRepeat: 'no-repeat',
						backgroundSize: '300px',
						backgroundAttachment: 'fixed',
					},
					color: {
						text: '#dddddd',
						background: '#555555',
						gradient:
							'linear-gradient(135deg,rgb(255,203,112) 0%,rgb(33,32,33) 42%,rgb(65,88,208) 100%)',
					},
					dimensions: {
						minHeight: '50vh',
					},
					spacing: {
						padding: { top: '10px', bottom: '5px' },
						margin: { right: '2em', left: '1vw' },
					},
					typography: {
						fontSize: '2.2rem',
						fontStyle: 'italic',
						fontWeight: '800',
						fontFamily: "'Helvetica Neue',sans-serif",
						lineHeight: '3.3',
						textColumns: '2',
						textDecoration: 'line-through',
						letterSpacing: '12px',
						textTransform: 'uppercase',
					},
					outline: {
						offset: '2px',
						width: '4px',
						style: 'dashed',
						color: 'red',
					},
					shadow: '10px 10px red',
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( [
			{
				selector: '.some-selector',
				key: 'color',
				value: '#dddddd',
			},
			{
				selector: '.some-selector',
				key: 'background',
				value: 'linear-gradient(135deg,rgb(255,203,112) 0%,rgb(33,32,33) 42%,rgb(65,88,208) 100%)',
			},
			{
				selector: '.some-selector',
				key: 'backgroundColor',
				value: '#555555',
			},
			{
				selector: '.some-selector',
				key: 'minHeight',
				value: '50vh',
			},
			{
				selector: '.some-selector',
				key: 'outlineColor',
				value: 'red',
			},
			{
				selector: '.some-selector',
				key: 'outlineStyle',
				value: 'dashed',
			},
			{
				selector: '.some-selector',
				key: 'outlineOffset',
				value: '2px',
			},
			{
				selector: '.some-selector',
				key: 'outlineWidth',
				value: '4px',
			},
			{
				selector: '.some-selector',
				key: 'marginRight',
				value: '2em',
			},
			{
				selector: '.some-selector',
				key: 'marginLeft',
				value: '1vw',
			},
			{
				selector: '.some-selector',
				key: 'paddingTop',
				value: '10px',
			},
			{
				selector: '.some-selector',
				key: 'paddingBottom',
				value: '5px',
			},
			{
				selector: '.some-selector',
				key: 'fontFamily',
				value: "'Helvetica Neue',sans-serif",
			},
			{
				selector: '.some-selector',
				key: 'fontSize',
				value: '2.2rem',
			},
			{
				selector: '.some-selector',
				key: 'fontStyle',
				value: 'italic',
			},
			{
				selector: '.some-selector',
				key: 'fontWeight',
				value: '800',
			},
			{
				selector: '.some-selector',
				key: 'letterSpacing',
				value: '12px',
			},
			{
				selector: '.some-selector',
				key: 'lineHeight',
				value: '3.3',
			},
			{
				selector: '.some-selector',
				key: 'columnCount',
				value: '2',
			},
			{
				selector: '.some-selector',
				key: 'textDecoration',
				value: 'line-through',
			},
			{
				selector: '.some-selector',
				key: 'textTransform',
				value: 'uppercase',
			},
			{
				selector: '.some-selector',
				key: 'boxShadow',
				value: '10px 10px red',
			},
			{
				selector: '.some-selector',
				key: 'backgroundImage',
				value: "url( 'https://example.com/image.jpg' )",
			},
			{
				selector: '.some-selector',
				key: 'backgroundPosition',
				value: '50% 50%',
			},
			{
				selector: '.some-selector',
				key: 'backgroundRepeat',
				value: 'no-repeat',
			},
			{
				selector: '.some-selector',
				key: 'backgroundSize',
				value: '300px',
			},
			{
				selector: '.some-selector',
				key: 'backgroundAttachment',
				value: 'fixed',
			},
		] );
	} );

	it( 'should handle styles with CSS vars', () => {
		expect(
			getCSSRules(
				{
					color: {
						text: 'var:preset|color|bomba-picante',
					},
					spacing: { padding: '11px' },
				},
				{
					selector: '.some-selector a',
				}
			)
		).toEqual( [
			{
				selector: '.some-selector a',
				key: 'color',
				value: 'var(--wp--preset--color--bomba-picante)',
			},
			{
				selector: '.some-selector a',
				key: 'padding',
				value: '11px',
			},
		] );
	} );

	it( 'should output background image value when that value is a string', () => {
		expect(
			getCSSRules(
				{
					background: {
						backgroundImage:
							"linear-gradient(to bottom,rgb(255 255 0 / 50%),rgb(0 0 255 / 50%), url('https://example.com/image.jpg')",
					},
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( [
			{
				selector: '.some-selector',
				key: 'backgroundImage',
				value: "linear-gradient(to bottom,rgb(255 255 0 / 50%),rgb(0 0 255 / 50%), url('https://example.com/image.jpg')",
			},
		] );
	} );
} );
