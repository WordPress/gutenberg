'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '014', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '014' )],
		configFile: systemTestUtils.caseConfig( '014' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
