'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '043', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '043' )],
		configFile: systemTestUtils.caseConfig( '043' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
