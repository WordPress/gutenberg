/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	withToolbarControls,
	withAlign,
} from '../align';

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

	describe( 'withToolbarControls', () => {
		it( 'should do nothing if no valid alignments', () => {
			registerBlockType( 'core/foo', blockSettings );

			const EnhancedComponent = withToolbarControls( ( { wrapperProps } ) => (
				<div { ...wrapperProps } />
			) );

			const wrapper = mount(
				<EnhancedComponent
					name="core/foo"
					attributes={ {} }
					isSelected
				/>
			);

			expect( wrapper.children() ).toHaveLength( 1 );
		} );

		// Skipped temporarily until Enzyme publishes new version that works with React 16.3.0 APIs.
		// eslint-disable-next-line jest/no-disabled-tests
		it.skip( 'should render toolbar controls if valid alignments', () => {
			registerBlockType( 'core/foo', {
				...blockSettings,
				supports: {
					align: true,
					wideAlign: false,
				},
			} );

			const EnhancedComponent = withToolbarControls( ( { wrapperProps } ) => (
				<div { ...wrapperProps } />
			) );

			const wrapper = mount(
				<EnhancedComponent
					name="core/foo"
					attributes={ {} }
					isSelected
				/>
			);

			expect( wrapper.children() ).toHaveLength( 2 );
		} );
	} );

	describe( 'withAlign', () => {
		it( 'should render with wrapper props', () => {
			registerBlockType( 'core/foo', {
				...blockSettings,
				supports: {
					align: true,
					wideAlign: false,
				},
			} );

			const EnhancedComponent = withAlign( ( { wrapperProps } ) => (
				<div { ...wrapperProps } />
			) );

			const wrapper = mount(
				<EnhancedComponent
					block={ {
						name: 'core/foo',
						attributes: {
							align: 'left',
						},
					} }
				/>
			);

			expect( wrapper.childAt( 0 ).prop( 'wrapperProps' ) ).toEqual( {
				'data-align': 'left',
			} );
		} );

		it( 'should not render invalid align', () => {
			registerBlockType( 'core/foo', {
				...blockSettings,
				supports: {
					align: true,
					wideAlign: false,
				},
			} );

			const EnhancedComponent = withAlign( ( { wrapperProps } ) => (
				<div { ...wrapperProps } />
			) );

			const wrapper = mount(
				<EnhancedComponent
					block={ {
						name: 'core/foo',
						attributes: {
							align: 'wide',
						},
					} }
				/>
			);

			expect( wrapper.childAt( 0 ).prop( 'wrapperProps' ) ).toBeUndefined();
		} );
	} );
} );
