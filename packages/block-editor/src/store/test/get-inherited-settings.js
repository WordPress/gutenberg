/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getInheritedSettings } from '../get-inherited-settings';

describe( 'getInheritedSettings', () => {
	it( 'uses block setting', () => {
		const state = {
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
		};

		expect(
			getInheritedSettings( state, 'block-1', 'layout.contentSize' )
		).toEqual( [ '840px' ] );
	} );

	it( 'uses blockEditor.useSetting.before hook override', () => {
		const state = {
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
		};

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
			getInheritedSettings( state, 'block-1', 'layout.contentSize' )
		).toEqual( [ '960px' ] );

		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );
} );
