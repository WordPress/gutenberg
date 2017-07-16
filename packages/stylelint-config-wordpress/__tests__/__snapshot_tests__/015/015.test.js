'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '015', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '015' )],
		configFile: systemTestUtils.caseConfig( '015' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
