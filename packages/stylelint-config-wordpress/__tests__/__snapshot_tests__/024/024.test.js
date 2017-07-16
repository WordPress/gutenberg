'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '024', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '024' )],
		configFile: systemTestUtils.caseConfig( '024' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
