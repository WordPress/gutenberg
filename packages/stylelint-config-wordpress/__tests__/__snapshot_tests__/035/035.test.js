'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '035', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '035' )],
		configFile: systemTestUtils.caseConfig( '035' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
