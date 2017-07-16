'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '027', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '027' )],
		configFile: systemTestUtils.caseConfig( '027' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
