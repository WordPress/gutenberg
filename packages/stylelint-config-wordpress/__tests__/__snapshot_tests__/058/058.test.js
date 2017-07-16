'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '058', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '058' )],
		configFile: systemTestUtils.caseConfig( '058' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
