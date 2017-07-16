'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '055', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '055' )],
		configFile: systemTestUtils.caseConfig( '055' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
