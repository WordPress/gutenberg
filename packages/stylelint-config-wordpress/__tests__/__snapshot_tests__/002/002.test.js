'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '002', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '002' )],
		configFile: systemTestUtils.caseConfig( '002' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
