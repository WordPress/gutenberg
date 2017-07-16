'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '019', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '019' )],
		configFile: systemTestUtils.caseConfig( '019' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
