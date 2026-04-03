const mockApiFetch = jest.fn();
const mockRegisterAbility = jest.fn();
const mockRegisterAbilityCategory = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: mockApiFetch,
} ) );

jest.mock( '@wordpress/abilities', () => ( {
	__esModule: true,
	registerAbility: mockRegisterAbility,
	registerAbilityCategory: mockRegisterAbilityCategory,
} ) );

describe( 'initialize', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockRegisterAbility.mockReset();
		mockRegisterAbilityCategory.mockReset();
	} );

	it( 'should register abilities with sanitized schemas', async () => {
		const serverAbilities = [
			{
				name: 'ai/summarize',
				input_schema: {
					type: 'object',
					properties: {
						content: {
							type: 'string',
							sanitize_callback: 'sanitize_text_field',
							description: 'The content to summarize.',
						},
						format: {
							type: 'string',
							validate_callback: 'is_valid_format',
							arg_options: {
								sanitize_callback: 'sanitize_key',
							},
						},
					},
				},
				output_schema: {
					type: 'object',
					properties: {
						summary: {
							type: 'string',
							sanitize_callback: 'wp_kses_post',
						},
					},
				},
				meta: {
					annotations: { readonly: true },
				},
			},
		];

		mockApiFetch.mockImplementation( ( options: any ) => {
			if ( options.path?.includes( '/categories' ) ) {
				return Promise.resolve( [] );
			}
			return Promise.resolve( serverAbilities );
		} );

		jest.isolateModules( () => {
			require( '../index' );
		} );

		// Flush microtasks for the two sequential awaits in initialize().
		await new Promise( process.nextTick );

		expect( mockRegisterAbility ).toHaveBeenCalledTimes( 1 );

		const registered = mockRegisterAbility.mock.calls[ 0 ][ 0 ];

		expect( registered.input_schema ).toEqual( {
			type: 'object',
			properties: {
				content: {
					type: 'string',
					description: 'The content to summarize.',
				},
				format: {
					type: 'string',
				},
			},
		} );

		expect( registered.output_schema ).toEqual( {
			type: 'object',
			properties: {
				summary: {
					type: 'string',
				},
			},
		} );

		expect( typeof registered.callback ).toBe( 'function' );

		expect( registered.meta ).toEqual( {
			annotations: {
				readonly: true,
				serverRegistered: true,
			},
		} );
	} );

	it( 'should preserve schemas that have no WP keywords', async () => {
		const serverAbilities = [
			{
				name: 'ai/clean',
				input_schema: {
					type: 'object',
					properties: {
						text: {
							type: 'string',
							minLength: 1,
						},
					},
					required: [ 'text' ],
				},
				output_schema: null,
			},
		];

		mockApiFetch.mockImplementation( ( options: any ) => {
			if ( options.path?.includes( '/categories' ) ) {
				return Promise.resolve( [] );
			}
			return Promise.resolve( serverAbilities );
		} );

		jest.isolateModules( () => {
			require( '../index' );
		} );

		await new Promise( process.nextTick );

		expect( mockRegisterAbility ).toHaveBeenCalledTimes( 1 );

		const registered = mockRegisterAbility.mock.calls[ 0 ][ 0 ];

		expect( registered.input_schema ).toEqual( {
			type: 'object',
			properties: {
				text: {
					type: 'string',
					minLength: 1,
				},
			},
			required: [ 'text' ],
		} );

		expect( registered.output_schema ).toBeUndefined();
	} );
} );
