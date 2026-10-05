import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const { v2: dockerCompose } = require( 'docker-compose' );
const {
	findDatabaseDowngrade,
	isNewerVersion,
	parseMariaDBVersion,
} = require( '../runtime/docker/database-downgrade' );

describe( 'parseMariaDBVersion', () => {
	it.each( [
		[ '1:12.3.3+maria~ubu2404', '12.3.3' ],
		[ '1:10.3.39+maria~ubu2004', '10.3.39' ],
		[ '12.3.3-MariaDB', '12.3.3' ],
		[ '10.6.28-MariaDB', '10.6.28' ],
	] )( 'reads the version from %j', ( text, expected ) => {
		expect( parseMariaDBVersion( text ) ).toBe( expected );
	} );

	it.each( [ '', undefined, 'no version here' ] )(
		'returns null for %j',
		( text ) => {
			expect( parseMariaDBVersion( text ) ).toBeNull();
		}
	);
} );

describe( 'isNewerVersion', () => {
	it.each( [
		[ '12.3.3', '10.6.28', true ],
		[ '10.11.2', '10.6.28', true ],
		[ '11.4.2', '11.4.1', true ],
		[ '10.6.28', '12.3.3', false ],
		[ '10.6.28', '10.11.2', false ],
		[ '11.4.2', '11.4.2', false ],
	] )( 'compares %j with %j', ( version, compareVersion, expected ) => {
		expect( isNewerVersion( version, compareVersion ) ).toBe( expected );
	} );
} );

describe( 'findDatabaseDowngrade', () => {
	const dockerComposeConfig = { config: 'docker-compose.yml' };

	beforeEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'finds a database last used by a newer version', async () => {
		const run = vi
			.spyOn( dockerCompose, 'run' )
			.mockResolvedValueOnce( {
				out: '1:12.3.3+maria~ubu2404\n12.3.3-MariaDB',
			} )
			.mockResolvedValueOnce( {
				out: '1:10.6.28+maria~ubu2004\n12.3.3-MariaDB',
			} );

		await expect(
			findDatabaseDowngrade(
				[ 'mysql', 'tests-mysql' ],
				dockerComposeConfig
			)
		).resolves.toEqual( {
			service: 'tests-mysql',
			dataVersion: '12.3.3',
			serverVersion: '10.6.28',
		} );
		expect( run ).toHaveBeenCalledWith(
			'mysql',
			expect.any( Array ),
			expect.objectContaining( {
				config: 'docker-compose.yml',
				commandOptions: [ '--rm', '--no-deps', '--entrypoint', 'sh' ],
			} )
		);
	} );

	it( 'checks every database and reports the first downgrade in order', async () => {
		const run = vi.spyOn( dockerCompose, 'run' ).mockResolvedValue( {
			out: '1:10.6.28+maria~ubu2004\n12.3.3-MariaDB',
		} );

		await expect(
			findDatabaseDowngrade(
				[ 'mysql', 'tests-mysql' ],
				dockerComposeConfig
			)
		).resolves.toEqual( {
			service: 'mysql',
			dataVersion: '12.3.3',
			serverVersion: '10.6.28',
		} );
		expect( run ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'ignores a database last used by the same or an older version', async () => {
		vi.spyOn( dockerCompose, 'run' ).mockResolvedValue( {
			out: '1:12.3.3+maria~ubu2404\n10.6.28-MariaDB',
		} );

		await expect(
			findDatabaseDowngrade( [ 'mysql' ], dockerComposeConfig )
		).resolves.toBeNull();
	} );

	it( 'ignores a database without a recorded version', async () => {
		vi.spyOn( dockerCompose, 'run' ).mockResolvedValue( {
			out: '1:10.6.28+maria~ubu2004\n',
		} );

		await expect(
			findDatabaseDowngrade( [ 'mysql' ], dockerComposeConfig )
		).resolves.toBeNull();
	} );

	it( 'ignores a database whose versions cannot be read', async () => {
		vi.spyOn( dockerCompose, 'run' ).mockRejectedValue( {
			exitCode: 1,
			out: '',
			err: 'no such service',
		} );

		await expect(
			findDatabaseDowngrade( [ 'mysql' ], dockerComposeConfig )
		).resolves.toBeNull();
	} );
} );
