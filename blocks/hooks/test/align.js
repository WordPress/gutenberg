/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { addAssignedAlign } from '../align';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '../../api';

describe( 'align', () => {
	const blockSettings = {
		save: noop,
		category: 'common',
		title: 'block title',
	};

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'addAttribute()', () => {
		const filterRegisterBlockType = applyFilters.bind( null, 'blocks.registerBlockType' );

		it( 'should do nothing if the block settings does not define align support', () => {
			const settings = filterRegisterBlockType( blockSettings );

			expect( settings.attributes ).toBeUndefined();
		} );

		it( 'should assign a new align attribute', () => {
			const settings = filterRegisterBlockType( {
				...blockSettings,
				supports: {
					align: true,
				},
			} );

			expect( settings.attributes ).toHaveProperty( 'align' );
		} );
	} );

	describe( 'addAssignedAlign', () => {
		it( 'should do nothing if block does not support align', () => {
			registerBlockType( 'core/foo', blockSettings );

			const props = addAssignedAlign( {
				className: 'foo',
			}, 'core/foo', {
				align: 'wide',
			} );

			expect( props ).toEqual( {
				className: 'foo',
			} );
		} );

		it( 'should do add align classname if block supports align', () => {
			registerBlockType( 'core/foo', {
				...blockSettings,
				supports: {
					align: true,
				},
			} );

			const props = addAssignedAlign( {
				className: 'foo',
			}, 'core/foo', {
				align: 'wide',
			} );

			expect( props ).toEqual( {
				className: 'alignwide foo',
			} );
		} );
	} );
} );
