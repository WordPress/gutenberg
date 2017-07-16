'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '030', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '030' )],
		configFile: systemTestUtils.caseConfig( '030' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
