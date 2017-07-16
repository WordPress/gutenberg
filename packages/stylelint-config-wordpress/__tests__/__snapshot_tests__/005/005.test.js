'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '005', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '005' )],
		configFile: systemTestUtils.caseConfig( '005' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
