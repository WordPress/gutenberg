'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '004', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '004' )],
		configFile: systemTestUtils.caseConfig( '004' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
