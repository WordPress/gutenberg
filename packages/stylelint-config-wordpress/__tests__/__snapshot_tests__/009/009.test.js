'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '009', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '009' )],
		configFile: systemTestUtils.caseConfig( '009' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
