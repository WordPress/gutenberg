/**
 * Internal dependencies
 */
import {
	getActiveDimensionValue,
	getDimensionResetAttributes,
	getDimensionUpdateAttributes,
	getStyleStateKey,
	resetDimensions,
	resetStateDimensions,
	setStateDimensions,
} from '../style-state';

describe( 'style state dimension utilities', () => {
	it( 'resets root dimensions without changing viewport dimensions', () => {
		const style = {
			dimensions: {
				aspectRatio: '1',
				minHeight: '40px',
			},
			'@mobile': {
				dimensions: {
					aspectRatio: '2',
				},
			},
		};

		expect( resetDimensions( style, [ 'aspectRatio' ] ) ).toEqual( {
			dimensions: {
				minHeight: '40px',
			},
			'@mobile': {
				dimensions: {
					aspectRatio: '2',
				},
			},
		} );
	} );

	it( 'resets dimensions only for the selected viewport state', () => {
		const style = {
			dimensions: {
				aspectRatio: '1',
			},
			'@mobile': {
				dimensions: {
					aspectRatio: '2',
					width: '200px',
				},
			},
			'@tablet': {
				dimensions: {
					aspectRatio: '3',
				},
			},
		};

		expect(
			resetStateDimensions(
				style,
				{ viewport: '@mobile', pseudo: 'default' },
				[ 'aspectRatio' ]
			)
		).toEqual( {
			dimensions: {
				aspectRatio: '1',
			},
			'@mobile': {
				dimensions: {
					width: '200px',
				},
			},
			'@tablet': {
				dimensions: {
					aspectRatio: '3',
				},
			},
		} );
	} );

	it( 'sets dimensions only for the selected viewport state', () => {
		const style = {
			'@mobile': {
				dimensions: {
					width: '200px',
				},
			},
			'@tablet': {
				dimensions: {
					width: '300px',
				},
			},
		};

		expect(
			setStateDimensions(
				style,
				{ viewport: '@mobile', pseudo: 'default' },
				{ height: '100px' }
			)
		).toEqual( {
			'@mobile': {
				dimensions: {
					height: '100px',
					width: '200px',
				},
			},
			'@tablet': {
				dimensions: {
					width: '300px',
				},
			},
		} );
	} );

	it( 'generates a stable key for selected style states', () => {
		expect(
			getStyleStateKey( { viewport: '@mobile', pseudo: ':hover' } )
		).toBe( '@mobile::hover' );
		expect( getStyleStateKey( undefined ) ).toBe( 'default:default' );
	} );

	it( 'reads root attribute dimensions for the default state', () => {
		expect(
			getActiveDimensionValue( {
				attributes: {
					width: '200px',
				},
				attributeKey: 'width',
				hasSelectedStyleState: false,
			} )
		).toBe( '200px' );
	} );

	it( 'reads mapped dimensions for selected style states', () => {
		expect(
			getActiveDimensionValue( {
				attributes: {
					scale: 'cover',
					style: {
						'@mobile': {
							dimensions: {
								objectFit: 'contain',
							},
						},
					},
				},
				selectedState: { viewport: '@mobile', pseudo: 'default' },
				hasSelectedStyleState: true,
				attributeKey: 'scale',
				styleKey: 'objectFit',
			} )
		).toBe( 'contain' );
	} );

	it( 'maps root dimension attributes to selected style state dimensions', () => {
		expect(
			getDimensionUpdateAttributes( {
				style: {
					'@mobile': {
						dimensions: {
							width: '200px',
						},
					},
				},
				selectedState: { viewport: '@mobile', pseudo: 'default' },
				hasSelectedStyleState: true,
				nextDimensions: {
					scale: 'contain',
				},
				dimensionKeyMap: {
					scale: 'objectFit',
				},
			} )
		).toEqual( {
			style: {
				'@mobile': {
					dimensions: {
						objectFit: 'contain',
						width: '200px',
					},
				},
			},
		} );
	} );

	it( 'clears omitted controlled root dimension attributes', () => {
		expect(
			getDimensionUpdateAttributes( {
				hasSelectedStyleState: false,
				nextDimensions: {
					aspectRatio: '16/9',
					width: '200px',
					scale: 'cover',
				},
				dimensionKeys: [ 'aspectRatio', 'width', 'height', 'scale' ],
			} )
		).toEqual( {
			aspectRatio: '16/9',
			width: '200px',
			height: undefined,
			scale: 'cover',
		} );
	} );

	it( 'clears omitted controlled selected style state dimensions', () => {
		expect(
			getDimensionUpdateAttributes( {
				style: {
					'@mobile': {
						dimensions: {
							height: '100px',
							width: '200px',
						},
					},
				},
				selectedState: { viewport: '@mobile', pseudo: 'default' },
				hasSelectedStyleState: true,
				nextDimensions: {
					aspectRatio: '16/9',
					width: '200px',
					scale: 'cover',
				},
				dimensionKeyMap: {
					scale: 'objectFit',
				},
				dimensionKeys: [ 'aspectRatio', 'width', 'height', 'scale' ],
			} )
		).toEqual( {
			style: {
				'@mobile': {
					dimensions: {
						aspectRatio: '16/9',
						objectFit: 'cover',
						width: '200px',
					},
				},
			},
		} );
	} );

	it( 'resets selected style state dimensions without root attributes', () => {
		expect(
			getDimensionResetAttributes( {
				attributes: {
					width: '200px',
					style: {
						dimensions: {
							width: '300px',
						},
						'@mobile': {
							dimensions: {
								width: '400px',
							},
						},
					},
				},
				selectedState: { viewport: '@mobile', pseudo: 'default' },
				hasSelectedStyleState: true,
				keys: [ 'width' ],
				defaultAttributes: {
					width: undefined,
				},
			} )
		).toEqual( {
			style: {
				dimensions: {
					width: '300px',
				},
			},
		} );
	} );

	it( 'resets default dimensions and root attributes', () => {
		expect(
			getDimensionResetAttributes( {
				attributes: {
					width: '200px',
					style: {
						dimensions: {
							width: '300px',
						},
						'@mobile': {
							dimensions: {
								width: '400px',
							},
						},
					},
				},
				hasSelectedStyleState: false,
				keys: [ 'width' ],
				defaultAttributes: {
					width: undefined,
				},
			} )
		).toEqual( {
			width: undefined,
			style: {
				'@mobile': {
					dimensions: {
						width: '400px',
					},
				},
			},
		} );
	} );
} );
