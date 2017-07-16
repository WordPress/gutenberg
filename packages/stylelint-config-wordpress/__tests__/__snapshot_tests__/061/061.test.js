'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '061', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '061' )],
		configFile: systemTestUtils.caseConfig( '061' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
