import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { findReusableRuns } = require( '../find-reusable-plugin-artifacts.mjs' );

const sha = 'a'.repeat( 40 );
const runsPath = `/actions/workflows/performance.yml/runs?event=push&branch=trunk&head_sha=${ sha }&per_page=5`;
const artifactsPath = ( id ) =>
	`/actions/runs/${ id }/artifacts?name=plugin-${ sha }`;

const run = ( overrides = {} ) => ( {
	id: 1,
	event: 'push',
	head_branch: 'trunk',
	...overrides,
} );
const artifact = ( overrides = {} ) => ( {
	name: `plugin-${ sha }`,
	expired: false,
	workflow_run: { id: 1 },
	...overrides,
} );

const request = ( responses ) => {
	const paths = [];
	const fake = ( path ) => {
		paths.push( path );
		return responses[ path ]
			? Promise.resolve( responses[ path ] )
			: Promise.reject( new Error( `Unexpected ${ path }` ) );
	};
	fake.paths = paths;
	return fake;
};

const base = ( overrides = {} ) => ( {
	name: 'trunk',
	sha,
	reusable: true,
	...overrides,
} );

describe( 'findReusableRuns', () => {
	it( 'finds the run that built the commit', async () => {
		const fake = request( {
			[ runsPath ]: { workflow_runs: [ run() ] },
			[ artifactsPath( 1 ) ]: { artifacts: [ artifact() ] },
		} );
		const [ branch ] = await findReusableRuns( [ base() ], fake );
		expect( branch.reuseRunId ).toBe( 1 );
		expect( console ).toHaveLogged();
	} );

	it( 'takes the first run that has the artifact', async () => {
		const fake = request( {
			[ runsPath ]: { workflow_runs: [ run(), run( { id: 2 } ) ] },
			[ artifactsPath( 1 ) ]: { artifacts: [] },
			[ artifactsPath( 2 ) ]: {
				artifacts: [ artifact( { workflow_run: { id: 2 } } ) ],
			},
		} );
		const [ branch ] = await findReusableRuns( [ base() ], fake );
		expect( branch.reuseRunId ).toBe( 2 );
		expect( console ).toHaveLogged();
	} );

	it( 'skips a run that was not a push', async () => {
		const fake = request( {
			[ runsPath ]: {
				workflow_runs: [ run( { event: 'workflow_dispatch' } ) ],
			},
		} );
		const [ branch ] = await findReusableRuns( [ base() ], fake );
		expect( branch.reuseRunId ).toBeUndefined();
		expect( console ).toHaveLogged();
	} );

	it( 'skips a run that was not on trunk', async () => {
		const fake = request( {
			[ runsPath ]: {
				workflow_runs: [ run( { head_branch: 'release/24.0' } ) ],
			},
		} );
		const [ branch ] = await findReusableRuns( [ base() ], fake );
		expect( branch.reuseRunId ).toBeUndefined();
		expect( console ).toHaveLogged();
	} );

	it( 'skips an artifact with another name', async () => {
		const fake = request( {
			[ runsPath ]: { workflow_runs: [ run() ] },
			[ artifactsPath( 1 ) ]: {
				artifacts: [ artifact( { name: 'plugin-trunk' } ) ],
			},
		} );
		const [ branch ] = await findReusableRuns( [ base() ], fake );
		expect( branch.reuseRunId ).toBeUndefined();
		expect( console ).toHaveLogged();
	} );

	it( 'skips an expired artifact and one belonging to another run', async () => {
		const fake = request( {
			[ runsPath ]: { workflow_runs: [ run() ] },
			[ artifactsPath( 1 ) ]: {
				artifacts: [
					artifact( { expired: true } ),
					artifact( { workflow_run: { id: 99 } } ),
				],
			},
		} );
		const [ branch ] = await findReusableRuns( [ base() ], fake );
		expect( branch.reuseRunId ).toBeUndefined();
		expect( console ).toHaveLogged();
	} );

	it( 'leaves branches that cannot be reused alone', async () => {
		const fake = request( {} );
		const branches = await findReusableRuns(
			[
				{ name: 'head', sha },
				{ name: 'wp/7.1', reusable: true },
			],
			fake
		);
		expect( branches.every( ( { reuseRunId } ) => ! reuseRunId ) ).toBe(
			true
		);
		expect( fake.paths ).toEqual( [] );
		expect( console ).toHaveLogged();
	} );

	it( 'builds when the API fails', async () => {
		const fake = request( {} );
		const [ branch ] = await findReusableRuns( [ base() ], fake );
		expect( branch.reuseRunId ).toBeUndefined();
		expect( console ).toHaveLogged();
	} );

	it( 'builds when a response is malformed', async () => {
		const fake = request( { [ runsPath ]: {} } );
		const [ branch ] = await findReusableRuns( [ base() ], fake );
		expect( branch.reuseRunId ).toBeUndefined();
		expect( console ).toHaveLogged();
	} );

	it( 'stops mid branch once it runs out of time', async () => {
		const fake = request( { [ runsPath ]: { workflow_runs: [ run() ] } } );
		const slow = ( path ) =>
			new Promise( ( resolve ) => setTimeout( resolve, 20 ) ).then( () =>
				fake( path )
			);
		const [ branch ] = await findReusableRuns(
			[ base() ],
			slow,
			Date.now() + 10
		);
		expect( branch.reuseRunId ).toBeUndefined();
		// The first request went out, the artifact lookup did not.
		expect( fake.paths ).toEqual( [ runsPath ] );
		expect( console ).toHaveLogged();
	} );

	it( 'does not look anything up once the budget is gone', async () => {
		const fake = request( {} );
		const [ branch ] = await findReusableRuns(
			[ base() ],
			fake,
			Date.now() - 1
		);
		expect( branch.reuseRunId ).toBeUndefined();
		expect( fake.paths ).toEqual( [] );
		expect( console ).toHaveLogged();
	} );
} );
