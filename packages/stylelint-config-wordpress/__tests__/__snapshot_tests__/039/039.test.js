'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '039', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '039' )],
		configFile: systemTestUtils.caseConfig( '039' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
