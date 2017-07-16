'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '023', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '023' )],
		configFile: systemTestUtils.caseConfig( '023' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
