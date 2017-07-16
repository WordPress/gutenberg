'use strict';

const stylelint = require( 'stylelint' ),
	systemTestUtils = require( '../systemTestUtils.js' );

it( '059', () => {
	return stylelint.lint({
		files: [systemTestUtils.caseStylesheetGlob( '059' )],
		configFile: systemTestUtils.caseConfig( '059' ),
	}).then( ({ results }) => {
		expect( systemTestUtils.prepResults( results ) ).toMatchSnapshot();
	});
});
