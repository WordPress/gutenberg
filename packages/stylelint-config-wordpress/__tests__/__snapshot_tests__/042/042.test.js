'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '042', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '042' )],
		configFile: systemTestUtils.caseConfig( '042' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
