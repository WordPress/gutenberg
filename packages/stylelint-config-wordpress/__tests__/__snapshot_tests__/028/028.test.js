'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '028', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '028' )],
		configFile: systemTestUtils.caseConfig( '028' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
