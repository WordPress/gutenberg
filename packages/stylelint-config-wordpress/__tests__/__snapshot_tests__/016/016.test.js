'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '016', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '016' )],
		configFile: systemTestUtils.caseConfig( '016' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
