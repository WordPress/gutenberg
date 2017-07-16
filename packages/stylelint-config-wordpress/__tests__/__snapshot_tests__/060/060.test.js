'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '060', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '060' )],
		configFile: systemTestUtils.caseConfig( '060' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
