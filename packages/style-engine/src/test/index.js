/**
 * Internal dependencies
 */
import { getCSSRules, generate, getClassnames } from '../index';

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
			'background-color: #222222; background: linear-gradient(135deg,rgb(6,147,227) 0%,rgb(143,47,47) 49%,rgb(155,81,224) 100%); color: #f1f1f1; margin: 12px; padding: 10px;'
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
			'.some-selector { margin-top: 11px; margin-right: 12px; margin-bottom: 13px; margin-left: 14px; padding-top: 10px; padding-bottom: 5px; font-size: 2.2rem; letter-spacing: 12px; line-height: 3.3; text-decoration: line-through; text-transform: uppercase; }'
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
					spacing: {
						padding: { top: '10px', bottom: '5px' },
						margin: { right: '2em', left: '1vw' },
					},
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( [
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
		] );
	} );
} );

describe( 'getClassnames', () => {
	it( 'should return an empty classnames array', () => {
		expect( getClassnames( {} ) ).toEqual( [] );
	} );

	it( 'should generate classnames for eligible custom styles', () => {
		expect(
			getClassnames( {
				spacing: { padding: '10px', margin: '12px' },
				color: { text: '#381515', background: '#000000' },
			} )
		).toEqual( [ 'has-background', 'has-text-color' ] );
	} );

	it( 'should generate classnames for eligible preset values', () => {
		expect(
			getClassnames( {
				spacing: { padding: '10px', margin: '12px' },
				color: {
					text: 'var:preset|color|whiteAsShow',
					background: 'var:preset|color|mustardPickles',
					gradient: 'var:preset|gradient|hairyOrange',
				},
			} )
		).toEqual( [
			'has-mustard-pickles-background-color',
			'has-background',
			'has-hairy-orange-gradient-background',
			'has-white-as-show-color',
			'has-text-color',
		] );
	} );
} );
