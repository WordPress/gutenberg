import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const DockerRuntime = require( '..' );

describe( 'DockerRuntime', () => {
	describe( 'getPublishedPorts', () => {
		it( 'returns the HTTP ports of the running services by config path', async () => {
			const runtime = new DockerRuntime();
			vi.spyOn( runtime, '_getPublicDockerPort' ).mockImplementation(
				async ( service ) => {
					if ( service === 'wordpress' ) {
						return '8890';
					}
					if ( service === 'tests-wordpress' ) {
						return '8891';
					}
					throw new Error( 'No such service.' );
				}
			);

			const ports = await runtime.getPublishedPorts( {
				dockerComposeConfigPath: '/path/to/docker-compose.yml',
			} );

			expect( ports ).toEqual( {
				'env.development.port': 8890,
				'env.tests.port': 8891,
			} );
		} );
	} );
} );
