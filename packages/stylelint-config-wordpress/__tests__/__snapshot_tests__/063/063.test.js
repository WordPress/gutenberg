'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '063', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '063' )],
		configFile: systemTestUtils.caseConfig( '063' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
