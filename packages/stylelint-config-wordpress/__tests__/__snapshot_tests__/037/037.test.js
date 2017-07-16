'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '037', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '037' )],
		configFile: systemTestUtils.caseConfig( '037' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
