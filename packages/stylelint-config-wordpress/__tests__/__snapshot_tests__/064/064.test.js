'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '064', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '064' )],
		configFile: systemTestUtils.caseConfig( '064' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
