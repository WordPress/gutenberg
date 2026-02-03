/**
 * Unit Test: Verify auto-compute behavior for field labeling
 */

type TestField = {
	id: string;
	isValid?: { required?: boolean };
};

describe( 'Auto-compute markWhenOptional logic', () => {
	// Simulate the DataForm auto-compute logic
	function computeMarkWhenOptional( fields: TestField[] ): boolean {
		const requiredCount = fields.filter(
			( f ) => !! f.isValid?.required
		).length;
		const optionalCount = fields.length - requiredCount;
		return requiredCount > optionalCount;
	}

	it( 'should mark optional when mostly required (6 req, 2 opt)', () => {
		const fields = [
			{ id: 'text', isValid: { required: true } },
			{ id: 'email', isValid: { required: true } },
			{ id: 'password', isValid: { required: true } },
			{ id: 'number', isValid: { required: true } },
			{ id: 'integer', isValid: { required: true } },
			{ id: 'boolean', isValid: { required: true } },
			{ id: 'color' }, // optional
			{ id: 'textarea' }, // optional
		];
		expect( computeMarkWhenOptional( fields ) ).toBe( true );
	} );

	it( 'should mark required when mostly optional (2 req, 6 opt)', () => {
		const fields = [
			{ id: 'text', isValid: { required: true } },
			{ id: 'email', isValid: { required: true } },
			{ id: 'password' },
			{ id: 'number' },
			{ id: 'integer' },
			{ id: 'boolean' },
			{ id: 'color' },
			{ id: 'textarea' },
		];
		expect( computeMarkWhenOptional( fields ) ).toBe( false );
	} );

	it( 'should mark required on tie (4 req, 4 opt)', () => {
		const fields = [
			{ id: 'a', isValid: { required: true } },
			{ id: 'b', isValid: { required: true } },
			{ id: 'c', isValid: { required: true } },
			{ id: 'd', isValid: { required: true } },
			{ id: 'e' },
			{ id: 'f' },
			{ id: 'g' },
			{ id: 'h' },
		];
		expect( computeMarkWhenOptional( fields ) ).toBe( false );
	} );

	it( 'should return true when all required (marking optional = nothing)', () => {
		const fields = [
			{ id: 'text', isValid: { required: true } },
			{ id: 'email', isValid: { required: true } },
			{ id: 'password', isValid: { required: true } },
		];
		expect( computeMarkWhenOptional( fields ) ).toBe( true );
	} );

	it( 'should return false when all optional (marking required = nothing)', () => {
		const fields = [ { id: 'text' }, { id: 'email' }, { id: 'password' } ];
		expect( computeMarkWhenOptional( fields ) ).toBe( false );
	} );
} );
