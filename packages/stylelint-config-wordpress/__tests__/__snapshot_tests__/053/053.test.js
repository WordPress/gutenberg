'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '053', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '053' )],
		configFile: systemTestUtils.caseConfig( '053' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
