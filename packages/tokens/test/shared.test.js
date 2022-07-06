// eslint-disable-next-line jest/no-export
export const jsTester = ( parse ) => () => {
	const tokenForms = [
		[
			'#{echo}#',
			{
				namespace: 'core',
				name: 'echo',
				value: null,
				fallback: '',
				context: null,
			},
		],
		[
			'#{core/identity}#',
			{
				namespace: 'core',
				name: 'identity',
				value: null,
				fallback: '',
				context: null,
			},
		],
		[
			'#{"token":"core/identity"}#',
			{
				namespace: 'core',
				name: 'identity',
				value: null,
				fallback: '',
				context: null,
			},
		],
		[
			'#{echo="\u{3c}"}#',
			{
				namespace: 'core',
				name: 'echo',
				value: '<',
				fallback: '',
				context: null,
			},
		],
		[
			'#{"token":"my_plugin/widget", "value": {"name": "sprocket"}, "fallback": "just a sprocket"}#',
			{
				namespace: 'my_plugin',
				name: 'widget',
				value: { name: 'sprocket' },
				fallback: 'just a sprocket',
				context: null,
			},
		],
		[
			'#{my_plugin/widget={"name":"sprocket"}}#',
			{
				namespace: 'my_plugin',
				name: 'widget',
				value: { name: 'sprocket' },
				fallback: '',
				context: null,
			},
		],
	];

	it.each( tokenForms )( 'basic token syntax: %s', ( input, token ) => {
		const output = parse( input );
		expect( output ).toHaveProperty( 'tokens', [ token ] );
		expect( output ).toHaveProperty( 'output', '{{TOKEN_1}}' );
	} );

	it( 'avoids escaping quoted tokens', () => {
		expect( parse( '##{not-a-token}#' ) ).toEqual( {
			tokens: [],
			output: '#{not-a-token}#',
		} );
	} );

	it( 'fails to parse when # is unescaped inside of token', () => {
		expect( parse( '#{echo="look out for #1"}#' ) ).toEqual( {
			tokens: [],
			output: '#{echo="look out for #1"}#',
		} );

		expect( parse( '#{echo="look out for \\u00231"}#' ) ).toEqual( {
			tokens: [
				{
					namespace: 'core',
					name: 'echo',
					value: 'look out for #1',
					fallback: '',
					context: null,
				},
			],
			output: '{{TOKEN_1}}',
		} );
	} );

	it.each( [
		[ '#a{echo}#', 'attribute' ],
		[ '#h{echo}#', 'html' ],
		[ '#j{echo}#', 'javascript' ],
		[ '#z{echo}#', null ],
		[ '#3{echo}#', null ],
		[ '#{echo}#', null ],
	] )( 'recognizes context-specifying sigils: %s', ( input, context ) => {
		expect( parse( input ).tokens[ 0 ] ).toHaveProperty(
			'context',
			context
		);
	} );
};

const hasPHP =
	'test' === process.env.NODE_ENV
		? ( () => {
				const process = require( 'child_process' ).spawnSync(
					'php',
					[ '-r', 'echo 1;' ],
					{
						encoding: 'utf8',
					}
				);

				return process.status === 0 && process.stdout === '1';
		  } )()
		: false;

// Skipping if `php` isn't available to us, such as in local dev without it
// skipping preserves snapshots while commenting out or simply
// not injecting the tests prompts `jest` to remove "obsolete snapshots"
const makeTest = hasPHP
	? // eslint-disable-next-line jest/valid-describe-callback, jest/valid-title
	  ( ...args ) => describe( ...args )
	: // eslint-disable-next-line jest/no-disabled-tests, jest/valid-describe-callback, jest/valid-title
	  ( ...args ) => describe.skip( ...args );

// eslint-disable-next-line jest/no-export
export const phpTester = ( name, filename ) =>
	makeTest(
		name,
		'test' === process.env.NODE_ENV
			? jsTester( ( doc ) => {
					const process = require( 'child_process' ).spawnSync(
						'php',
						[ '-f', filename ],
						{
							input: doc,
							encoding: 'utf8',
							timeout: 30 * 1000, // Abort after 30 seconds, that's too long anyway.
						}
					);

					if ( process.status !== 0 ) {
						throw new Error( process.stderr || process.stdout );
					}

					try {
						/*
						 * Due to an issue with PHP's json_encode() serializing an empty associative array
						 * as an empty list `[]` we're manually replacing the already-encoded bit here.
						 *
						 * This is an issue with the test runner, not with the parser.
						 */
						return JSON.parse(
							process.stdout.replace(
								/"attributes":\s*\[\]/g,
								'"attributes":{}'
							)
						);
					} catch ( e ) {
						// eslint-disable-next-line no-console
						console.error( process.stdout );
						throw new Error(
							'failed to parse JSON:\n' + process.stdout
						);
					}
			  } )
			: () => {}
	);
