'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '046', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '046' )],
		configFile: systemTestUtils.caseConfig( '046' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
