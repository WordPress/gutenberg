'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '056', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '056' )],
		configFile: systemTestUtils.caseConfig( '056' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
