'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '057', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '057' )],
		configFile: systemTestUtils.caseConfig( '057' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
