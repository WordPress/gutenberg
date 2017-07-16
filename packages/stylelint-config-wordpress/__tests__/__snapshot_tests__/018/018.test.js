'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '018', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '018' )],
		configFile: systemTestUtils.caseConfig( '018' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
