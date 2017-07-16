'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '045', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '045' )],
		configFile: systemTestUtils.caseConfig( '045' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
