'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '050', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '050' )],
		configFile: systemTestUtils.caseConfig( '050' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
