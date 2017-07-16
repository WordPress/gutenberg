'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '041', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '041' )],
		configFile: systemTestUtils.caseConfig( '041' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
