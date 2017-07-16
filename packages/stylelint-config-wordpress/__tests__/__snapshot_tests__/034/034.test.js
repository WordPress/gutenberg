'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '034', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '034' )],
		configFile: systemTestUtils.caseConfig( '034' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
