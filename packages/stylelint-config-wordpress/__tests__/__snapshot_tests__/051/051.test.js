'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '051', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '051' )],
		configFile: systemTestUtils.caseConfig( '051' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
