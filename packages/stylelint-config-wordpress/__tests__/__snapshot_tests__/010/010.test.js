'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '010', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '010' )],
		configFile: systemTestUtils.caseConfig( '010' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
