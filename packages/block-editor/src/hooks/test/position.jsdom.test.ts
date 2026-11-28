import { describe, expect, it } from 'vitest';
import { getPositionOptions, getResponsivePositionCSS } from '../position';

const selector = '.wp-container-test.wp-container-test';
const viewportSettings = {
	mobile: '640px',
	tablet: '960px',
};

describe( 'getResponsivePositionCSS', () => {
	it( 'inherits default position values in a responsive viewport state', () => {
		expect(
			getResponsivePositionCSS( {
				selector,
				style: {
					position: {
						type: 'sticky',
						top: '0px',
					},
					'@mobile': {
						position: {
							right: '1rem',
						},
					},
				},
				viewportSettings,
			} )
		).toBe(
			'@media (width <= 640px){.wp-container-test.wp-container-test {position: sticky;top: 0px;right: 1rem;z-index: 10}}'
		);
	} );

	it( 'uses the responsive position type when it overrides the default', () => {
		expect(
			getResponsivePositionCSS( {
				selector,
				style: {
					position: {
						type: 'sticky',
						top: '0px',
					},
					'@tablet': {
						position: {
							type: 'fixed',
						},
					},
				},
				viewportSettings,
			} )
		).toBe(
			'@media (640px < width <= 960px){.wp-container-test.wp-container-test {position: fixed;top: 0px;z-index: 10}}'
		);
	} );

	it( 'resets the default position when a responsive state clears it', () => {
		expect(
			getResponsivePositionCSS( {
				selector,
				style: {
					position: {
						type: 'fixed',
						top: '0px',
					},
					'@mobile': {
						position: {
							type: undefined,
						},
					},
				},
				viewportSettings,
			} )
		).toBe(
			'@media (width <= 640px){.wp-container-test.wp-container-test{position: static;}}'
		);
	} );
} );

describe( 'getPositionOptions', () => {
	const getValues = (
		options: Parameters< typeof getPositionOptions >[ 0 ]
	) => getPositionOptions( options ).map( ( option ) => option.value );

	it( 'offers sticky when the block supports it', () => {
		expect(
			getValues( {
				allowFixed: false,
				allowSticky: true,
				isInTemplatePart: false,
			} )
		).toEqual( [ '__default', 'sticky' ] );
	} );

	it( 'hides sticky inside a template part', () => {
		expect(
			getValues( {
				allowFixed: false,
				allowSticky: true,
				isInTemplatePart: true,
			} )
		).toEqual( [ '__default' ] );
	} );

	it( 'keeps sticky inside a template part when it is already set', () => {
		expect(
			getValues( {
				allowFixed: false,
				allowSticky: true,
				isInTemplatePart: true,
				value: 'sticky',
			} )
		).toEqual( [ '__default', 'sticky' ] );
	} );

	it( 'keeps fixed inside a template part', () => {
		expect(
			getValues( {
				allowFixed: true,
				allowSticky: true,
				isInTemplatePart: true,
			} )
		).toEqual( [ '__default', 'fixed' ] );
	} );
} );
