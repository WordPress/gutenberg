'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '044', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '044' )],
		configFile: systemTestUtils.caseConfig( '044' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
