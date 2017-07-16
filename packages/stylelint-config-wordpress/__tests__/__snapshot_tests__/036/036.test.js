'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '036', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '036' )],
		configFile: systemTestUtils.caseConfig( '036' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
