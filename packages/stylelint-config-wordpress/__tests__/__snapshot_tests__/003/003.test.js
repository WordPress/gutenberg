'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '003', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '003' )],
		configFile: systemTestUtils.caseConfig( '003' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
