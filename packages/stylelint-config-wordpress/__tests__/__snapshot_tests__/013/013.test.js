'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '013', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '013' )],
		configFile: systemTestUtils.caseConfig( '013' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
