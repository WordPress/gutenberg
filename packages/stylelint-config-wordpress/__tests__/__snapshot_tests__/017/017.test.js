'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '017', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '017' )],
		configFile: systemTestUtils.caseConfig( '017' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
