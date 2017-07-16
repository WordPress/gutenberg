'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '006', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '006' )],
		configFile: systemTestUtils.caseConfig( '006' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
