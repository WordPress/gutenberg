'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '049', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '049' )],
		configFile: systemTestUtils.caseConfig( '049' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
