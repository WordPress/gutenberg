'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '054', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '054' )],
		configFile: systemTestUtils.caseConfig( '054' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
