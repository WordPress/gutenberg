'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '065', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '065' )],
		configFile: systemTestUtils.caseConfig( '065' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
