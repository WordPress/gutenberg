import {
	getPopulatedViewportStyleStates,
	getResponsiveStylesLabel,
	getStyleForState,
	scopeResetAllFilterToState,
	setStyleForState,
} from '../block-style-state';

describe( 'getPopulatedViewportStyleStates', () => {
	it( 'returns no viewport states when a block has no responsive style overrides', () => {
		expect(
			getPopulatedViewportStyleStates( {
				color: { text: '#000000' },
				':hover': { color: { text: '#ff0000' } },
				'@current': { color: { text: '#00ff00' } },
			} )
		).toEqual( [] );
	} );

	it( 'returns populated viewport states in display order', () => {
		expect(
			getPopulatedViewportStyleStates( {
				'@mobile': { color: { text: '#ff0000' } },
				'@tablet': { spacing: { padding: { top: '20px' } } },
			} )
		).toEqual( [ '@tablet', '@mobile' ] );
	} );

	it( 'counts pseudo-state styles nested inside a viewport', () => {
		expect(
			getPopulatedViewportStyleStates( {
				'@mobile': {
					':hover': { color: { text: '#ff0000' } },
				},
			} )
		).toEqual( [ '@mobile' ] );
	} );

	it( 'ignores empty and malformed viewport style slices', () => {
		expect(
			getPopulatedViewportStyleStates( {
				'@tablet': { color: { text: undefined } },
				'@mobile': null,
			} )
		).toEqual( [] );
	} );

	it( 'does not mutate the style attribute', () => {
		const style = {
			'@tablet': { color: { text: undefined } },
			'@mobile': { color: { text: '#ff0000' } },
		};

		getPopulatedViewportStyleStates( style );

		expect( style ).toEqual( {
			'@tablet': { color: { text: undefined } },
			'@mobile': { color: { text: '#ff0000' } },
		} );
	} );
} );

describe( 'getResponsiveStylesLabel', () => {
	it( 'returns no description when a block has no responsive styles', () => {
		expect( getResponsiveStylesLabel( {} ) ).toBeNull();
	} );

	it( 'describes a single responsive viewport', () => {
		expect(
			getResponsiveStylesLabel( {
				'@mobile': { color: { text: '#ff0000' } },
			} )
		).toBe( 'Block has responsive styles for Mobile.' );
	} );

	it( 'describes all responsive viewports in display order', () => {
		expect(
			getResponsiveStylesLabel( {
				'@mobile': { color: { text: '#ff0000' } },
				'@tablet': { spacing: { padding: { top: '20px' } } },
			} )
		).toBe( 'Block has responsive styles for Tablet, Mobile.' );
	} );
} );

describe( 'getStyleForState', () => {
	it( 'returns the root style for the default state', () => {
		const style = { color: { text: '#000000' } };

		expect(
			getStyleForState( style, {
				viewport: 'default',
				pseudo: 'default',
			} )
		).toBe( style );
	} );

	it( 'returns the selected pseudo state style', () => {
		const style = {
			color: { text: '#000000' },
			':hover': { color: { text: '#ff0000' } },
		};

		expect(
			getStyleForState( style, {
				viewport: 'default',
				pseudo: ':hover',
			} )
		).toEqual( {
			color: { text: '#ff0000' },
		} );
	} );

	it( 'returns the selected viewport state style', () => {
		const style = {
			color: { text: '#000000' },
			'@mobile': { color: { text: '#ff0000' } },
		};

		expect(
			getStyleForState( style, {
				viewport: '@mobile',
				pseudo: 'default',
			} )
		).toEqual( {
			color: { text: '#ff0000' },
		} );
	} );

	it( 'returns the selected viewport pseudo state style', () => {
		const style = {
			'@mobile': {
				':hover': { color: { text: '#ff0000' } },
			},
		};

		expect(
			getStyleForState( style, {
				viewport: '@mobile',
				pseudo: ':hover',
			} )
		).toEqual( {
			color: { text: '#ff0000' },
		} );
	} );
} );

describe( 'setStyleForState', () => {
	it( 'replaces the root style for the default state', () => {
		expect(
			setStyleForState(
				{ color: { text: '#000000' } },
				{ viewport: 'default', pseudo: 'default' },
				{
					typography: { fontSize: '32px' },
				}
			)
		).toEqual( {
			typography: { fontSize: '32px' },
		} );
	} );

	it( 'updates only the selected pseudo state style', () => {
		expect(
			setStyleForState(
				{
					color: { text: '#000000' },
					':hover': { color: { text: '#ff0000' } },
				},
				{ viewport: 'default', pseudo: ':hover' },
				{ typography: { fontSize: '32px' } }
			)
		).toEqual( {
			color: { text: '#000000' },
			':hover': { typography: { fontSize: '32px' } },
		} );
	} );

	it( 'updates only the selected viewport state style', () => {
		expect(
			setStyleForState(
				{
					color: { text: '#000000' },
					'@mobile': { color: { text: '#ff0000' } },
				},
				{ viewport: '@mobile', pseudo: 'default' },
				{ typography: { fontSize: '32px' } }
			)
		).toEqual( {
			color: { text: '#000000' },
			'@mobile': { typography: { fontSize: '32px' } },
		} );
	} );

	it( 'updates only the selected viewport pseudo state style', () => {
		expect(
			setStyleForState(
				{
					color: { text: '#000000' },
					'@mobile': {
						color: { text: '#ff0000' },
						':hover': { color: { text: '#00ff00' } },
					},
				},
				{ viewport: '@mobile', pseudo: ':hover' },
				{ typography: { fontSize: '32px' } }
			)
		).toEqual( {
			color: { text: '#000000' },
			'@mobile': {
				color: { text: '#ff0000' },
				':hover': { typography: { fontSize: '32px' } },
			},
		} );
	} );

	it( 'removes the selected state key when the new state style is empty', () => {
		expect(
			setStyleForState(
				{
					color: { text: '#000000' },
					':hover': { color: { text: '#ff0000' } },
				},
				{ viewport: 'default', pseudo: ':hover' },
				{ color: { text: undefined } }
			)
		).toEqual( {
			color: { text: '#000000' },
		} );
	} );
} );

describe( 'scopeResetAllFilterToState', () => {
	it( 'passes only the selected state style to the reset filter', () => {
		const innerReset = jest.fn( ( attributes ) => ( {
			...attributes,
			style: {
				...attributes.style,
				color: undefined,
			},
			textColor: undefined,
		} ) );
		const attributes = {
			style: {
				color: { text: '#000000' },
				':hover': {
					color: { text: '#ff0000' },
					typography: { fontSize: '32px' },
				},
				':focus': { color: { text: '#0000ff' } },
			},
		};

		const result = scopeResetAllFilterToState(
			{ viewport: 'default', pseudo: ':hover' },
			innerReset
		)( attributes );

		expect( innerReset ).toHaveBeenCalledWith( {
			style: attributes.style[ ':hover' ],
		} );
		expect( result ).toEqual( {
			style: {
				color: { text: '#000000' },
				':hover': {
					typography: { fontSize: '32px' },
				},
				':focus': { color: { text: '#0000ff' } },
			},
		} );
	} );

	it( 'removes the state key when the scoped reset leaves it empty', () => {
		const innerReset = () => ( { style: undefined } );
		const attributes = {
			style: {
				color: { text: '#000000' },
				':hover': { color: { text: '#ff0000' } },
			},
		};

		const result = scopeResetAllFilterToState(
			{ viewport: 'default', pseudo: ':hover' },
			innerReset
		)( attributes );

		expect( result ).toEqual( {
			style: {
				color: { text: '#000000' },
			},
		} );
	} );

	it( 'calls the reset filter with an empty style when no state styles exist', () => {
		const innerReset = jest.fn( ( attributes ) => attributes );
		const attributes = {
			style: { color: { text: '#000000' } },
		};

		scopeResetAllFilterToState(
			{ viewport: 'default', pseudo: ':hover' },
			innerReset
		)( attributes );

		expect( innerReset ).toHaveBeenCalledWith( { style: {} } );
	} );

	it( 'passes only the selected viewport pseudo state style to the reset filter', () => {
		const innerReset = jest.fn( () => ( { style: undefined } ) );
		const attributes = {
			style: {
				color: { text: '#000000' },
				'@mobile': {
					color: { text: '#ff0000' },
					':hover': { color: { text: '#00ff00' } },
				},
			},
		};

		const result = scopeResetAllFilterToState(
			{ viewport: '@mobile', pseudo: ':hover' },
			innerReset
		)( attributes );

		expect( innerReset ).toHaveBeenCalledWith( {
			style: attributes.style[ '@mobile' ][ ':hover' ],
		} );
		expect( result ).toEqual( {
			style: {
				color: { text: '#000000' },
				'@mobile': { color: { text: '#ff0000' } },
			},
		} );
	} );

	it( 'returns the original reset filter for the default state', () => {
		const innerReset = () => ( { style: undefined } );

		expect(
			scopeResetAllFilterToState(
				{ viewport: 'default', pseudo: 'default' },
				innerReset
			)
		).toBe( innerReset );
	} );
} );
