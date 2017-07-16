'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '012', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '012' )],
		configFile: systemTestUtils.caseConfig( '012' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
