'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '066', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '066' )],
		configFile: systemTestUtils.caseConfig( '066' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
