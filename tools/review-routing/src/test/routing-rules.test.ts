import { describe, expect, it } from 'vitest';
import {
	DEFAULT_THRESHOLD,
	loadRoutingRules,
	parseRoutingRule,
	readContext,
} from '../routing-rules.ts';

describe( 'parseRoutingRule', () => {
	it( 'reads the reviewer, the threshold and the instructions', () => {
		expect(
			parseRoutingRule(
				'data',
				'---\nreviewer: WordPress/data\nthreshold: 0.8\n---\n\nAsk when stores change.\n'
			)
		).toEqual( {
			id: 'data',
			reviewers: [ 'WordPress/data' ],
			threshold: 0.8,
			instructions: 'Ask when stores change.',
		} );
	} );

	it( 'reads several reviewers as a flow sequence', () => {
		expect(
			parseRoutingRule(
				'data',
				'---\nreviewer: [ octocat, WordPress/data ]\n---\nAsk.'
			).reviewers
		).toEqual( [ 'octocat', 'WordPress/data' ] );
	} );

	it( 'removes a leading @ from each reviewer', () => {
		expect(
			parseRoutingRule(
				'data',
				'---\nreviewer: [ @octocat, @WordPress/data ]\n---\nAsk.'
			).reviewers
		).toEqual( [ 'octocat', 'WordPress/data' ] );
	} );

	it( 'splits reviewers only inside brackets', () => {
		expect(
			parseRoutingRule(
				'data',
				'---\nreviewer: octocat, WordPress/data\n---\nAsk.'
			).reviewers
		).toEqual( [ 'octocat, WordPress/data' ] );
	} );

	it( 'uses the default threshold when none is set', () => {
		expect(
			parseRoutingRule(
				'data',
				'---\nreviewer: WordPress/data\n---\nAsk.'
			).threshold
		).toBe( DEFAULT_THRESHOLD );
	} );

	it.each( [
		[ 'no front matter', 'data', 'Ask.' ],
		[ 'no reviewer', 'data', '---\nthreshold: 0.5\n---\nAsk.' ],
		[ 'an empty reviewer list', 'data', '---\nreviewer: []\n---\nAsk.' ],
		[
			'a bad threshold',
			'data',
			'---\nreviewer: a/b\nthreshold: 2\n---\nAsk.',
		],
		[ 'no instructions', 'data', '---\nreviewer: a/b\n---\n' ],
		[ 'a bad id', 'data team', '---\nreviewer: a/b\n---\nAsk.' ],
	] )( 'rejects a file with %s', ( _, id, source ) => {
		expect( () => parseRoutingRule( id, source ) ).toThrow();
	} );
} );

describe( 'readContext', () => {
	it( 'reads the object that the default export returns', async () => {
		expect(
			await readContext( 'data', {
				default: async () => ( { stores: [ 'core' ] } ),
			} )
		).toEqual( { stores: [ 'core' ] } );
	} );

	it.each( [
		[ 'a default export that is not a function', { default: {} } ],
		[ 'a function that returns an array', { default: () => [] } ],
		[
			'an object with a question',
			{ default: () => ( { question: 'Ask.' } ) },
		],
	] )( 'rejects a module with %s', async ( _, module ) => {
		await expect( readContext( 'data', module ) ).rejects.toThrow(
			/^data\.mts: /
		);
	} );
} );

describe( 'loadRoutingRules', () => {
	it( 'reads the routing files in the repository', async () => {
		const rules = await loadRoutingRules();

		expect( rules.map( ( rule ) => rule.id ) ).toContain(
			'design-system-api'
		);
	} );

	it( 'reads the context of a rule from its .mts file', async () => {
		const [ withContext, withoutContext ] = await loadRoutingRules(
			new URL( './fixtures/routing-rules/', import.meta.url )
		);

		expect( withContext.context ).toEqual( { stores: [ 'core' ] } );
		expect( withoutContext.context ).toBeUndefined();
	} );
} );
