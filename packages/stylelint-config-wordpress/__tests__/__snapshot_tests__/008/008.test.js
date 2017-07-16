'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '008', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '008' )],
		configFile: systemTestUtils.caseConfig( '008' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
