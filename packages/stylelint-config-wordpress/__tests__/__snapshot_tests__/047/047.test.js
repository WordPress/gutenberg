'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '047', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '047' )],
		configFile: systemTestUtils.caseConfig( '047' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
