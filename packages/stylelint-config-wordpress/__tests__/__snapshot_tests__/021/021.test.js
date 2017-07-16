'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '021', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '021' )],
		configFile: systemTestUtils.caseConfig( '021' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
