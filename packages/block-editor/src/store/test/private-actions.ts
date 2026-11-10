import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import {
	hideBlockInterface,
	showBlockInterface,
	expandBlock,
	__experimentalUpdateSettings,
	setInsertionPoint,
	startDragging,
	stopDragging,
	showViewportModal,
	hideViewportModal,
	setSelectedBlockStyleState,
	setSelectedBlockStyleStateCanvasPreview,
	editContentOnlySection,
	stopEditingContentOnlySection,
} from '../private-actions';
import type { BlockEditorThunkArgs, Settings } from '../types';

type MockDispatch = Mock & Record< string, Mock >;

function thunkArgs( args: Record< string, unknown > ) {
	return args as unknown as BlockEditorThunkArgs;
}

describe( 'private actions', () => {
	describe( 'hideBlockInterface', () => {
		it( 'should return the HIDE_BLOCK_INTERFACE action', () => {
			expect( hideBlockInterface() ).toEqual( {
				type: 'HIDE_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( 'showBlockInterface', () => {
		it( 'should return the SHOW_BLOCK_INTERFACE action', () => {
			expect( showBlockInterface() ).toEqual( {
				type: 'SHOW_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( '__experimentalUpdateSettings', () => {
		const experimentalSettings: Settings = {
			// @ts-expect-error A placeholder, since the test only checks it is stripped.
			inserterMediaCategories: 'foo',
			blockInspectorAnimation: { animationParent: 'bar' },
		};

		const stableSettings = {
			foo: 'foo',
			bar: 'bar',
			baz: 'baz',
		};

		const settings = {
			...experimentalSettings,
			...stableSettings,
		};

		it( 'should dispatch provided settings by default', () => {
			expect( __experimentalUpdateSettings( settings ) ).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings,
				reset: false,
			} );
		} );

		it( 'should dispatch provided settings with reset flag when `reset` argument is truthy', () => {
			expect(
				__experimentalUpdateSettings( settings, {
					stripExperimentalSettings: false,
					reset: true,
				} )
			).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings,
				reset: true,
			} );
		} );

		it( 'should strip experimental settings from a given settings object when `stripExperimentalSettings` argument is truthy', () => {
			expect(
				__experimentalUpdateSettings( settings, {
					stripExperimentalSettings: true,
				} )
			).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings: {
					foo: 'foo',
					bar: 'bar',
					baz: 'baz',
				},
				reset: false,
			} );
		} );
	} );

	describe( 'startDragging', () => {
		it( 'should return the START_DRAGGING action', () => {
			expect( startDragging() ).toEqual( {
				type: 'START_DRAGGING',
			} );
		} );
	} );

	describe( 'stopDragging', () => {
		it( 'should return the STOP_DRAGGING action', () => {
			expect( stopDragging() ).toEqual( {
				type: 'STOP_DRAGGING',
			} );
		} );
	} );

	describe( 'expandBlock', () => {
		it( 'should return the SET_BLOCK_EXPANDED_IN_LIST_VIEW action', () => {
			expect( expandBlock( 'block-1' ) ).toEqual( {
				type: 'SET_BLOCK_EXPANDED_IN_LIST_VIEW',
				clientId: 'block-1',
			} );
		} );
	} );

	describe( 'setInsertionPoint', () => {
		it( 'should return the SET_INSERTION_POINT action', () => {
			expect(
				setInsertionPoint( {
					rootClientId: '',
					// @ts-expect-error A string, which the action passes through unchanged.
					index: '123',
				} )
			).toEqual( {
				type: 'SET_INSERTION_POINT',
				value: { rootClientId: '', index: '123' },
			} );
		} );
	} );

	describe( 'showViewportModal', () => {
		it( 'should return the SHOW_VIEWPORT_MODAL action with clientIds', () => {
			const clientIds = [ 'client-1', 'client-2' ];
			expect( showViewportModal( clientIds ) ).toEqual( {
				type: 'SHOW_VIEWPORT_MODAL',
				clientIds,
			} );
		} );
	} );

	describe( 'hideViewportModal', () => {
		it( 'should return the HIDE_VIEWPORT_MODAL action', () => {
			expect( hideViewportModal() ).toEqual( {
				type: 'HIDE_VIEWPORT_MODAL',
			} );
		} );
	} );

	describe( 'setSelectedBlockStyleState', () => {
		it( 'returns the SET_SELECTED_BLOCK_STYLE_STATE action', () => {
			expect(
				setSelectedBlockStyleState( 'client-1', { pseudo: ':hover' } )
			).toEqual( {
				type: 'SET_SELECTED_BLOCK_STYLE_STATE',
				clientId: 'client-1',
				value: { pseudo: ':hover' },
			} );
		} );
	} );

	describe( 'setSelectedBlockStyleStateCanvasPreview', () => {
		it( 'returns the SET_SELECTED_BLOCK_STYLE_STATE_CANVAS_PREVIEW action', () => {
			expect(
				setSelectedBlockStyleStateCanvasPreview( 'client-1', false )
			).toEqual( {
				type: 'SET_SELECTED_BLOCK_STYLE_STATE_CANVAS_PREVIEW',
				clientId: 'client-1',
				value: false,
			} );
		} );
	} );

	describe( 'editContentOnlySection', () => {
		it( 'dispatches EDIT_CONTENT_ONLY_SECTION with undefined when clientId is omitted', () => {
			const dispatch = vi.fn() as MockDispatch;
			const select = {
				getSelectedBlockClientId: vi.fn(),
				isSectionBlock: vi.fn(),
				getParentSectionBlock: vi.fn(),
			};

			editContentOnlySection()( thunkArgs( { select, dispatch } ) );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'EDIT_CONTENT_ONLY_SECTION',
				clientId: undefined,
			} );
		} );

		it( 'dispatches EDIT_CONTENT_ONLY_SECTION and selects block when not selected', () => {
			const dispatch = Object.assign( vi.fn(), {
				selectBlock: vi.fn(),
			} ) as MockDispatch;
			const select = {
				getSelectedBlockClientId: vi.fn( () => 'other-block' ),
				isSectionBlock: vi.fn( () => true ),
				getParentSectionBlock: vi.fn(),
			};

			editContentOnlySection( 'section-1' )(
				thunkArgs( { select, dispatch } )
			);

			expect( dispatch.selectBlock ).toHaveBeenCalledWith( 'section-1' );
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'EDIT_CONTENT_ONLY_SECTION',
				clientId: 'section-1',
			} );
		} );

		it( 'resolves parent section when clientId is not a section block', () => {
			const dispatch = Object.assign( vi.fn(), {
				selectBlock: vi.fn(),
			} ) as MockDispatch;
			const select = {
				getSelectedBlockClientId: vi.fn( () => 'child-block' ),
				isSectionBlock: vi.fn( () => false ),
				getParentSectionBlock: vi.fn( () => 'parent-section' ),
			};

			editContentOnlySection( 'child-block' )(
				thunkArgs( { select, dispatch } )
			);

			expect( dispatch.selectBlock ).not.toHaveBeenCalled();
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'EDIT_CONTENT_ONLY_SECTION',
				clientId: 'parent-section',
			} );
		} );
	} );

	describe( 'stopEditingContentOnlySection', () => {
		const TEST_CONTENT_BLOCK = 'core/test-content-block';
		const TEST_STRUCTURE_BLOCK = 'core/test-structure-block';

		beforeAll( () => {
			registerBlockType( TEST_CONTENT_BLOCK, {
				apiVersion: 3,
				title: 'Test content block',
				category: 'text',
				attributes: {
					content: {
						type: 'string',
						role: 'content',
					},
				},
				save: () => null,
			} );
			registerBlockType( TEST_STRUCTURE_BLOCK, {
				apiVersion: 3,
				title: 'Test structure block',
				category: 'design',
				save: () => null,
			} );
		} );

		afterAll( () => {
			unregisterBlockType( TEST_CONTENT_BLOCK );
			unregisterBlockType( TEST_STRUCTURE_BLOCK );
		} );

		it( 'does nothing when no section is currently being edited', () => {
			const dispatch = Object.assign( vi.fn(), {
				selectBlock: vi.fn(),
			} ) as MockDispatch;
			const select = {
				getEditedContentOnlySection: vi.fn( () => undefined ),
			};

			stopEditingContentOnlySection()(
				thunkArgs( { select, dispatch } )
			);

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'returns selection to the edited section when a non-content block inside the section is selected', () => {
			const dispatch = Object.assign( vi.fn(), {
				selectBlock: vi.fn(),
			} ) as MockDispatch;
			const select = {
				getEditedContentOnlySection: vi.fn( () => 'section-1' ),
				getSelectedBlockClientId: vi.fn( () => 'structure-1' ),
				getBlockParents: vi.fn( () => [ 'section-1' ] ),
				getBlockName: vi.fn( () => TEST_STRUCTURE_BLOCK ),
			};

			stopEditingContentOnlySection()(
				thunkArgs( { select, dispatch } )
			);

			expect( dispatch.selectBlock ).toHaveBeenCalledWith( 'section-1' );
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'EDIT_CONTENT_ONLY_SECTION',
			} );
		} );

		it( 'keeps content block selected when a content block inside the section is selected', () => {
			const dispatch = Object.assign( vi.fn(), {
				selectBlock: vi.fn(),
			} ) as MockDispatch;
			const select = {
				getEditedContentOnlySection: vi.fn( () => 'section-1' ),
				getSelectedBlockClientId: vi.fn( () => 'content-1' ),
				getBlockParents: vi.fn( () => [ 'section-1' ] ),
				getBlockName: vi.fn( () => TEST_CONTENT_BLOCK ),
			};

			stopEditingContentOnlySection()(
				thunkArgs( { select, dispatch } )
			);

			expect( dispatch.selectBlock ).not.toHaveBeenCalled();
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'EDIT_CONTENT_ONLY_SECTION',
			} );
		} );

		it( 'does not change selection when the selected block is outside the edited section', () => {
			const dispatch = Object.assign( vi.fn(), {
				selectBlock: vi.fn(),
			} ) as MockDispatch;
			const select = {
				getEditedContentOnlySection: vi.fn( () => 'section-1' ),
				getSelectedBlockClientId: vi.fn( () => 'outside-block' ),
				getBlockParents: vi.fn( () => [ 'other-parent' ] ),
				getBlockName: vi.fn( () => TEST_STRUCTURE_BLOCK ),
			};

			stopEditingContentOnlySection()(
				thunkArgs( { select, dispatch } )
			);

			expect( dispatch.selectBlock ).not.toHaveBeenCalled();
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'EDIT_CONTENT_ONLY_SECTION',
			} );
		} );
	} );
} );
