const utils = require( './utils' );
const getStylelintResult = utils.getStylelintResult;

const CONFIG = './.stylelintrc.project.tests.json';

describe( 'flags no warnings with valid project scss', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './project-valid.scss', CONFIG );
	} );

	it( 'did not error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeFalsy() );
	} );

	it( 'flags no warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 0 )
		);
	} );
} );

describe( 'flags warnings with invalid project scss', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './project-invalid.scss', CONFIG );
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 2 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
