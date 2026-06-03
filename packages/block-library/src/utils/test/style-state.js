/**
 * Internal dependencies
 */
import {
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
			mobile: {
				dimensions: {
					aspectRatio: '2',
				},
			},
		};

		expect( resetDimensions( style, [ 'aspectRatio' ] ) ).toEqual( {
			dimensions: {
				minHeight: '40px',
			},
			mobile: {
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
			mobile: {
				dimensions: {
					aspectRatio: '2',
					width: '200px',
				},
			},
			tablet: {
				dimensions: {
					aspectRatio: '3',
				},
			},
		};

		expect(
			resetStateDimensions(
				style,
				{ viewport: 'mobile', pseudo: 'default' },
				[ 'aspectRatio' ]
			)
		).toEqual( {
			dimensions: {
				aspectRatio: '1',
			},
			mobile: {
				dimensions: {
					width: '200px',
				},
			},
			tablet: {
				dimensions: {
					aspectRatio: '3',
				},
			},
		} );
	} );

	it( 'sets dimensions only for the selected viewport state', () => {
		const style = {
			mobile: {
				dimensions: {
					width: '200px',
				},
			},
			tablet: {
				dimensions: {
					width: '300px',
				},
			},
		};

		expect(
			setStateDimensions(
				style,
				{ viewport: 'mobile', pseudo: 'default' },
				{ height: '100px' }
			)
		).toEqual( {
			mobile: {
				dimensions: {
					height: '100px',
					width: '200px',
				},
			},
			tablet: {
				dimensions: {
					width: '300px',
				},
			},
		} );
	} );
} );
