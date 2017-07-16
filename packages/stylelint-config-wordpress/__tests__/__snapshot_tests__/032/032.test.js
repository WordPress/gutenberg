'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '032', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '032' )],
		configFile: systemTestUtils.caseConfig( '032' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
