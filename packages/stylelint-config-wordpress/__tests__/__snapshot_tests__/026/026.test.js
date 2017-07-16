'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '026', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '026' )],
		configFile: systemTestUtils.caseConfig( '026' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
