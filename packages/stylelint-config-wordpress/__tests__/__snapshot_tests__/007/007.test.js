'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '007', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '007' )],
		configFile: systemTestUtils.caseConfig( '007' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
