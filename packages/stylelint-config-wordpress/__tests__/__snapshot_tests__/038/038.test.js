'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '038', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '038' )],
		configFile: systemTestUtils.caseConfig( '038' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
