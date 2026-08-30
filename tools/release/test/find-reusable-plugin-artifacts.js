const {
	isTrustedRun,
	selectReusableArtifact,
	findReusableRuns,
} = require( '../find-reusable-plugin-artifacts.mjs' );

const run = ( overrides = {} ) => ( {
	id: 1,
	event: 'push',
	head_branch: 'trunk',
	...overrides,
} );
const artifact = ( overrides = {} ) => ( {
	name: 'plugin-abc',
	expired: false,
	workflow_run: { id: 1 },
	...overrides,
} );

describe( 'isTrustedRun', () => {
	it( 'trusts a push to trunk', () => {
		expect( isTrustedRun( run() ) ).toBe( true );
	} );

	it( 'does not trust another event or another branch', () => {
		expect( isTrustedRun( run( { event: 'pull_request' } ) ) ).toBe(
			false
		);
		expect( isTrustedRun( run( { head_branch: 'release/24.0' } ) ) ).toBe(
			false
		);
		expect( isTrustedRun( undefined ) ).toBe( false );
	} );
} );

describe( 'selectReusableArtifact', () => {
	it( 'returns the run holding the artifact', () => {
		expect(
			selectReusableArtifact(
				[ { run: run(), artifacts: [ artifact() ] } ],
				'plugin-abc'
			)
		).toBe( 1 );
	} );

	it( 'takes the first run that has it', () => {
		expect(
			selectReusableArtifact(
				[
					{ run: run( { id: 2 } ), artifacts: [] },
					{
						run: run( { id: 3 } ),
						artifacts: [ artifact( { workflow_run: { id: 3 } } ) ],
					},
				],
				'plugin-abc'
			)
		).toBe( 3 );
	} );

	it( 'skips untrusted runs even when they have the artifact', () => {
		expect(
			selectReusableArtifact(
				[
					{
						run: run( { event: 'workflow_dispatch' } ),
						artifacts: [ artifact() ],
					},
				],
				'plugin-abc'
			)
		).toBeUndefined();
	} );

	it( 'skips expired artifacts, other names and other runs', () => {
		const candidates = [
			{
				run: run(),
				artifacts: [
					artifact( { expired: true } ),
					artifact( { name: 'plugin-def' } ),
					artifact( { workflow_run: { id: 99 } } ),
				],
			},
		];
		expect(
			selectReusableArtifact( candidates, 'plugin-abc' )
		).toBeUndefined();
	} );

	it( 'handles runs without an artifact list', () => {
		expect(
			selectReusableArtifact(
				[ { run: run(), artifacts: undefined } ],
				'plugin-abc'
			)
		).toBeUndefined();
	} );
} );

describe( 'findReusableRuns', () => {
	const sha = 'a'.repeat( 40 );
	const request = ( responses ) => {
		const paths = [];
		const fake = ( path ) => {
			paths.push( path );
			const response = responses[ path ];
			if ( ! response ) {
				return Promise.reject( new Error( `Unexpected ${ path }` ) );
			}
			return Promise.resolve( response );
		};
		fake.paths = paths;
		return fake;
	};

	it( 'finds the run that built the commit', async () => {
		const fake = request( {
			[ `/actions/workflows/performance.yml/runs?event=push&branch=trunk&per_page=5&head_sha=${ sha }` ]:
				{ workflow_runs: [ run() ] },
			[ `/actions/runs/1/artifacts?name=plugin-${ sha }` ]: {
				artifacts: [ artifact( { name: `plugin-${ sha }` } ) ],
			},
		} );
		const [ branch ] = await findReusableRuns(
			[ { name: 'trunk', sha, reuse: 'sha' } ],
			fake
		);
		expect( branch.reuseRunId ).toBe( 1 );
		expect( console ).toHaveLogged();
	} );

	it( 'scans recent runs when it looks the artifact up by name', async () => {
		const fake = request( {
			'/actions/workflows/performance.yml/runs?event=push&branch=trunk&per_page=10':
				{ workflow_runs: [ run( { id: 7 } ) ] },
			[ `/actions/runs/7/artifacts?name=plugin-${ sha }` ]: {
				artifacts: [
					artifact( {
						name: `plugin-${ sha }`,
						workflow_run: { id: 7 },
					} ),
				],
			},
		} );
		const [ branch ] = await findReusableRuns(
			[ { name: 'reference', sha, reuse: 'name' } ],
			fake
		);
		expect( branch.reuseRunId ).toBe( 7 );
		expect( console ).toHaveLogged();
	} );

	it( 'leaves branches that cannot be reused alone', async () => {
		const fake = request( {} );
		const branches = await findReusableRuns(
			[
				{ name: 'head', sha },
				{ name: 'wp/7.1', reuse: 'sha' },
			],
			fake
		);
		expect( branches.every( ( { reuseRunId } ) => ! reuseRunId ) ).toBe(
			true
		);
		expect( fake.paths ).toEqual( [] );
		expect( console ).toHaveLogged();
	} );

	it( 'builds when the API fails, without failing the other branches', async () => {
		const fake = request( {
			'/actions/workflows/performance.yml/runs?event=push&branch=trunk&per_page=10':
				{ workflow_runs: [] },
		} );
		const branches = await findReusableRuns(
			[
				{ name: 'trunk', sha, reuse: 'sha' },
				{ name: 'reference', sha, reuse: 'name' },
			],
			fake
		);
		expect( branches.map( ( { reuseRunId } ) => reuseRunId ) ).toEqual( [
			undefined,
			undefined,
		] );
		expect( console ).toHaveLogged();
	} );

	it( 'builds when a response is malformed', async () => {
		const fake = request( {
			[ `/actions/workflows/performance.yml/runs?event=push&branch=trunk&per_page=5&head_sha=${ sha }` ]:
				{},
		} );
		const [ branch ] = await findReusableRuns(
			[ { name: 'trunk', sha, reuse: 'sha' } ],
			fake
		);
		expect( branch.reuseRunId ).toBeUndefined();
		expect( console ).toHaveLogged();
	} );

	it( 'stops mid branch once it runs out of time', async () => {
		const fake = request( {
			[ `/actions/workflows/performance.yml/runs?event=push&branch=trunk&per_page=5&head_sha=${ sha }` ]:
				{ workflow_runs: [ run() ] },
		} );
		const slow = ( path ) =>
			new Promise( ( resolve ) => setTimeout( resolve, 20 ) ).then( () =>
				fake( path )
			);
		const [ branch ] = await findReusableRuns(
			[ { name: 'trunk', sha, reuse: 'sha' } ],
			slow,
			Date.now() + 10
		);
		expect( branch.reuseRunId ).toBeUndefined();
		// The first request went out, the artifact lookup did not.
		expect( fake.paths ).toHaveLength( 1 );
		expect( console ).toHaveLogged();
	} );

	it( 'stops looking once it runs out of time', async () => {
		const fake = request( {} );
		const [ branch ] = await findReusableRuns(
			[ { name: 'trunk', sha, reuse: 'sha' } ],
			fake,
			Date.now() - 1
		);
		expect( branch.reuseRunId ).toBeUndefined();
		expect( fake.paths ).toEqual( [] );
		expect( console ).toHaveLogged();
	} );
} );
