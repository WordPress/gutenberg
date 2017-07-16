'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '048', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '048' )],
		configFile: systemTestUtils.caseConfig( '048' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
