'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '029', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '029' )],
		configFile: systemTestUtils.caseConfig( '029' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
