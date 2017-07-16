'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '040', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '040' )],
		configFile: systemTestUtils.caseConfig( '040' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
