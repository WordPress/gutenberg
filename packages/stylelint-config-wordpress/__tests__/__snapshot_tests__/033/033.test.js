'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '033', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '033' )],
		configFile: systemTestUtils.caseConfig( '033' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
