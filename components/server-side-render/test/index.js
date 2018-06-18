import httpBuildQuery from 'http-build-query';

// The following tests are adapted to the behavior of http-build-query v0.7.0,
// to help mitigating possible regressions in the upstream library.
describe( 'http-build-query', function() {
	test( 'should return an empty string for empty input', function() {
		expect( httpBuildQuery( null ) ).toBe( '' );
		expect( httpBuildQuery() ).toBe( '' );
		expect( httpBuildQuery( {} ) ).toBe( '' );
	} );

	test( 'should format basic url params ', function() {
		expect(
			httpBuildQuery( {
				stringArg: 'test',
				nullArg: null,
				emptyArg: '',
				numberArg: 123,
			} )
		).toBe(
			encodeURI(
				'stringArg=test&nullArg=&emptyArg=&numberArg=123'
			)
		);
	} );

	test( 'should format object params ', function() {
		expect(
			httpBuildQuery( {
				objectArg: {
					stringProp: 'test',
					numberProp: 123,
				},
			} )
		).toBe(
			encodeURI(
				'objectArg[stringProp]=test&objectArg[numberProp]=123'
			)
		);
	} );

	test( 'should format an array of objects', function() {
		expect(
			httpBuildQuery( {
				children: [
					{
						name: 'bobby',
						age: 12,
						sex: 'M',
					},
					{
						name: 'sally',
						age: 8,
						sex: 'F',
					},
				],
			} )
		).toBe(
			encodeURI(
				'children[0][name]=bobby&children[0][age]=12&children[0][sex]=M&children[1][name]=sally&children[1][age]=8&children[1][sex]=F'
			)
		);
	} );
} );
