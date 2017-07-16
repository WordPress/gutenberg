'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '011', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '011' )],
		configFile: systemTestUtils.caseConfig( '011' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
