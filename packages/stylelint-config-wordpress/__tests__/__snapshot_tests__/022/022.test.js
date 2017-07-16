'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '022', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '022' )],
		configFile: systemTestUtils.caseConfig( '022' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
