/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import {
	shortenTraceName,
	withTraceSafeNames,
} from './playwright-provider.vitest.mjs';

describe( 'Browser trace filenames', () => {
	it( 'preserves names that already fit safely', () => {
		expect( shortenTraceName( 'short-test-name-0-0' ) ).toBe(
			'short-test-name-0-0'
		);
	} );

	it( 'truncates long names with a stable distinguishing hash', () => {
		const sharedPrefix = 'nested-test-name-'.repeat( 20 );
		const first = shortenTraceName( `${ sharedPrefix }first-0-0` );
		const second = shortenTraceName( `${ sharedPrefix }second-0-0` );

		expect( first ).toHaveLength( 180 );
		expect( first ).toBe(
			shortenTraceName( `${ sharedPrefix }first-0-0` )
		);
		expect( first ).not.toBe( second );
		expect( first ).toMatch( /-[a-f0-9]{12}$/ );
	} );

	it( 'shortens only the trace-output command payload', async () => {
		const commands = new Map();
		const originalRegisterCommand = vi.fn( ( name, command ) => {
			commands.set( name, command );
		} );
		const project = {
			browser: {
				registerCommand: originalRegisterCommand,
			},
		};
		const traceCommand = vi.fn(
			async ( _context, payload ) => payload.name
		);
		const otherCommand = vi.fn( ( _context, payload ) => payload.name );
		const provider = withTraceSafeNames( {
			name: 'test-provider',
			providerFactory( currentProject ) {
				currentProject.browser.registerCommand(
					'__vitest_stopChunkTrace',
					traceCommand
				);
				currentProject.browser.registerCommand(
					'other-command',
					otherCommand
				);
				return {};
			},
		} );

		provider.providerFactory( project );

		const longName = 'nested-test-name-'.repeat( 20 );
		await expect(
			commands.get( '__vitest_stopChunkTrace' )( {}, { name: longName } )
		).resolves.toBe( shortenTraceName( longName ) );
		expect( commands.get( 'other-command' ) ).toBe( otherCommand );
		expect( project.browser.registerCommand ).toBe(
			originalRegisterCommand
		);
	} );
} );
