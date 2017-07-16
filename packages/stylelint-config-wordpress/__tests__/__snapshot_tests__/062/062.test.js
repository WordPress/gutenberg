'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '062', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '062' )],
		configFile: systemTestUtils.caseConfig( '062' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
