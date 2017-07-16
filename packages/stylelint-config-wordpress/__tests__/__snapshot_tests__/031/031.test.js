'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '031', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '031' )],
		configFile: systemTestUtils.caseConfig( '031' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
