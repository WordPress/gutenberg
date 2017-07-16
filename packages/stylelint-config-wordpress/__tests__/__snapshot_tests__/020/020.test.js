'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '020', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '020' )],
		configFile: systemTestUtils.caseConfig( '020' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
