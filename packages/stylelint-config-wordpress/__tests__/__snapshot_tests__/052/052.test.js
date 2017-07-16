'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '052', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '052' )],
		configFile: systemTestUtils.caseConfig( '052' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
