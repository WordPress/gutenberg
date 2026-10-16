import { describe, expect, it } from 'vitest';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { getBlockSettings } from '../get-block-settings';
import type { State } from '../types';

// The depth limit stops at recursive types such as block templates.
type DeepPartial<
	T,
	Depth extends unknown[] = [],
> = Depth[ 'length' ] extends 7
	? T
	: T extends ( ...args: never[] ) => unknown
		? T
		: T extends Node
			? T
			: T extends Map< infer K, infer V >
				? Map< K, DeepPartial< V, [ ...Depth, unknown ] > >
				: T extends object
					? {
							[ P in keyof T ]?: DeepPartial<
								T[ P ],
								[ ...Depth, unknown ]
							>;
						}
					: T;

/*
 * Fixtures set only the fields the selector under test reads, down to the
 * blocks in the maps, so this marks the deliberately partial states.
 */
function partial< T >( fixture: DeepPartial< T > ) {
	return fixture as T;
}

describe( 'getBlockSettings', () => {
	it( 'uses block setting', () => {
		const state = partial< State >( {
			settings: {
				__experimentalFeatures: {
					blocks: {
						'core/test-block': {
							layout: {
								contentSize: '840px',
							},
						},
					},
				},
			},
			blocks: {
				byClientId: new Map( [
					[
						'block-1',
						{
							name: 'core/test-block',
						},
					],
				] ),
				parents: new Map( [ [ 'block-1', '' ] ] ),
			},
		} );

		expect(
			getBlockSettings( state, 'block-1', 'layout.contentSize' )
		).toEqual( [ '840px' ] );
	} );

	it( 'uses blockEditor.useSetting.before hook override', () => {
		const state = partial< State >( {
			settings: {
				__experimentalFeatures: {
					blocks: {
						'core/test-block': {
							layout: {
								contentSize: '840px',
							},
						},
					},
				},
			},
			blocks: {
				byClientId: new Map( [
					[
						'block-1',
						{
							name: 'core/test-block',
						},
					],
				] ),
				parents: new Map( [ [ 'block-1', '' ] ] ),
			},
		} );

		addFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before',
			( result, path, clientId, blockName ) => {
				if ( blockName === 'core/test-block' ) {
					return '960px';
				}

				return result;
			}
		);

		expect(
			getBlockSettings( state, 'block-1', 'layout.contentSize' )
		).toEqual( [ '960px' ] );

		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );
} );
