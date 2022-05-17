/**
 * Internal dependencies
 */
import { getCSSRules, generate } from '../index';

describe( 'generate', () => {
	it( 'should generate empty style', () => {
		expect( generate( {}, '.some-selector' ) ).toEqual( '' );
	} );

	it( 'should generate inline styles where there is no selector', () => {
		expect(
			generate( {
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
			generate(
				{
					spacing: { padding: '10px', margin: '12px' },
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( '.some-selector { margin: 12px; padding: 10px; }' );

		expect(
			generate(
				{
					color: {
						text: '#cccccc',
						background: '#111111',
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
						textDecoration: 'line-through',
						letterSpacing: '12px',
						textTransform: 'uppercase',
					},
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual(
			'.some-selector { color: #cccccc; background-color: #111111; margin-top: 11px; margin-right: 12px; margin-bottom: 13px; margin-left: 14px; padding-top: 10px; padding-bottom: 5px; font-size: 2.2rem; font-style: italic; font-weight: 800; letter-spacing: 12px; line-height: 3.3; text-decoration: line-through; text-transform: uppercase; }'
		);
	} );

	it( 'should parse preset values (use for elements.link.color.text)', () => {
		expect(
			generate( {
				color: {
					text: 'var:preset|color|ham-sandwich',
				},
			} )
		).toEqual( 'color: var(--wp--preset--color--ham-sandwich);' );
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
					color: {
						text: '#dddddd',
						background: '#555555',
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
						textDecoration: 'line-through',
						letterSpacing: '12px',
						textTransform: 'uppercase',
					},
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
				key: 'backgroundColor',
				value: '#555555',
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
				key: 'fontSize',
				selector: '.some-selector',
				value: '2.2rem',
			},
			{
				key: 'fontStyle',
				selector: '.some-selector',
				value: 'italic',
			},
			{
				key: 'fontWeight',
				selector: '.some-selector',
				value: '800',
			},
			{
				key: 'letterSpacing',
				selector: '.some-selector',
				value: '12px',
			},
			{
				key: 'lineHeight',
				selector: '.some-selector',
				value: '3.3',
			},
			{
				key: 'textDecoration',
				selector: '.some-selector',
				value: 'line-through',
			},
			{
				key: 'textTransform',
				selector: '.some-selector',
				value: 'uppercase',
			},
		] );
	} );
} );
