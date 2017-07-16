'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '025', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '025' )],
		configFile: systemTestUtils.caseConfig( '025' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
