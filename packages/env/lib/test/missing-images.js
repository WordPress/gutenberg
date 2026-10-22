import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const yaml = require( 'js-yaml' );
const {
	findMissingImages,
	getPulledImages,
} = require( '../runtime/docker/missing-images' );
const { MissingImageError } = require( '../runtime/errors' );

const DOCKER_COMPOSE_CONFIG = {
	services: {
		mysql: { image: 'mariadb:10.12' },
		wordpress: { build: { dockerfile: 'WordPress.Dockerfile' } },
		cli: { build: { dockerfile: 'CLI.Dockerfile' } },
		phpmyadmin: { image: 'phpmyadmin' },
		'tests-mysql': { image: 'mariadb:10.12' },
		'tests-wordpress': {
			build: { dockerfile: 'Tests-WordPress.Dockerfile' },
		},
	},
};

describe( 'getPulledImages', () => {
	it( 'lists each image once, with the services that use it, and skips built services', () => {
		expect( getPulledImages( DOCKER_COMPOSE_CONFIG ) ).toEqual( [
			{ image: 'mariadb:10.12', services: [ 'mysql', 'tests-mysql' ] },
			{ image: 'phpmyadmin', services: [ 'phpmyadmin' ] },
		] );
	} );

	it( 'returns nothing without services', () => {
		expect( getPulledImages( {} ) ).toEqual( [] );
	} );
} );

describe( 'findMissingImages', () => {
	let directory;
	let dockerComposeConfigPath;

	beforeEach( () => {
		directory = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-env-missing-images-' )
		);
		dockerComposeConfigPath = path.join( directory, 'docker-compose.yml' );
		fs.writeFileSync(
			dockerComposeConfigPath,
			yaml.dump( DOCKER_COMPOSE_CONFIG )
		);
	} );

	afterEach( () => {
		fs.rmSync( directory, { recursive: true, force: true } );
	} );

	it( 'finds the pulled images that are not cached', async () => {
		const isCached = async ( image ) => image === 'phpmyadmin';

		await expect(
			findMissingImages( dockerComposeConfigPath, isCached )
		).resolves.toEqual( [
			{ image: 'mariadb:10.12', services: [ 'mysql', 'tests-mysql' ] },
		] );
	} );

	it( 'finds nothing when every pulled image is cached', async () => {
		const isCached = async () => true;

		await expect(
			findMissingImages( dockerComposeConfigPath, isCached )
		).resolves.toEqual( [] );
	} );
} );

describe( 'MissingImageError', () => {
	it( 'names the image and its services, points to mariadbVersion, and includes the last line of the Docker output', () => {
		const error = new MissingImageError(
			[
				{
					image: 'mariadb:10.12',
					services: [ 'mysql', 'tests-mysql' ],
				},
			],
			' Image mariadb:10.12 Pulling\n Image phpmyadmin Interrupted\nError response from daemon: docker.io/library/mariadb:10.12: not found\n'
		);

		expect( error.message ).toBe(
			'Could not pull `mariadb:10.12` (mysql, tests-mysql), and it is not available locally. Check that "mariadbVersion" is a published MariaDB version, such as "10.11" or "lts".\n\nError response from daemon: docker.io/library/mariadb:10.12: not found'
		);
	} );

	it( 'leaves out the mariadbVersion hint for other images', () => {
		const error = new MissingImageError( [
			{ image: 'phpmyadmin', services: [ 'phpmyadmin' ] },
			{ image: 'example', services: [ 'example' ] },
		] );

		expect( error.message ).toBe(
			'Could not pull `phpmyadmin` (phpmyadmin), `example` (example), and they are not available locally.'
		);
	} );
} );
