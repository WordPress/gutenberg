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
	setBlocksLock,
} from '../private-actions';
import type { BlockEditorThunkArgs, Settings } from '../types';

type MockDispatch = Mock & { [ key: string ]: any };

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
				attributes: {},
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

	describe( 'setBlocksLock', () => {
		// A Group, holding a Paragraph, inside a root block.
		const createSelect = (
			attributes: Record< string, Record< string, any > >,
			{
				rootTemplateLock = false,
				patternLocked = [] as string[],
			}: {
				rootTemplateLock?: string | false;
				patternLocked?: string[];
			} = {}
		) => {
			const names: Record< string, string > = {
				root: 'core/group',
				group: 'core/group',
				paragraph: 'core/paragraph',
			};
			const parents: Record< string, string | null > = {
				root: null,
				group: 'root',
				paragraph: 'group',
			};
			const children: Record< string, string[] > = {
				root: [ 'group' ],
				group: [ 'paragraph' ],
				paragraph: [],
			};
			const getClientIdsOfDescendants = ( ids: string[] ): string[] =>
				ids.flatMap( ( id ) => [
					...children[ id ],
					...getClientIdsOfDescendants( children[ id ] ),
				] );

			return {
				getClientIdsOfDescendants,
				getBlockName: ( id: string ) => names[ id ],
				canLockBlockType: () => true,
				getBlockAttributes: ( id: string ) => attributes[ id ] ?? {},
				getBlockRootClientId: ( id: string ) => parents[ id ],
				getTemplateLock: ( id: string | null ) =>
					id === 'root'
						? rootTemplateLock
						: ( attributes[ id ?? '' ]?.templateLock ?? false ),
				canLayoutLockBlock: ( id: string ) =>
					names[ id ] === 'core/group',
				isPatternLockedBlock: ( id: string ) =>
					patternLocked.includes( id ),
				canStylesLockBlock: () => true,
				isStylesLockedBlock: ( id: string ) =>
					!! attributes[ id ]?.lock?.styles,
				getBlockParents: ( id: string ) => {
					const ancestors: string[] = [];
					let parentId = parents[ id ];
					while ( parentId ) {
						ancestors.unshift( parentId );
						parentId = parents[ parentId ];
					}
					return ancestors;
				},
			};
		};

		it( 'locks the blocks and every block inside them in one update', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'group' ], {
				move: true,
				remove: true,
				layout: true,
			} )( thunkArgs( { select: createSelect( {} ), dispatch } ) );

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledTimes( 1 );
			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'group', 'paragraph' ],
				{
					group: {
						lock: { move: true, remove: true },
						templateLock: 'all',
					},
					// A paragraph can't lock its layout.
					paragraph: { lock: { move: true, remove: true } },
				},
				{ uniqueByBlock: true }
			);
		} );

		it( 'locks the styles of every block', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'group' ], { styles: true } )(
				thunkArgs( { select: createSelect( {} ), dispatch } )
			);

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'group', 'paragraph' ],
				{
					group: { lock: { styles: true } },
					paragraph: { lock: { styles: true } },
				},
				{ uniqueByBlock: true }
			);
		} );

		it( 'changes only the given property', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'paragraph' ], { remove: false } )(
				thunkArgs( {
					select: createSelect( {
						paragraph: { lock: { move: true, remove: true } },
					} ),
					dispatch,
				} )
			);

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'paragraph' ],
				{ paragraph: { lock: { move: true, remove: false } } },
				{ uniqueByBlock: true }
			);
		} );

		it( 'clears the lock and template lock on a full unlock', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'group' ], {
				move: false,
				remove: false,
				layout: false,
			} )(
				thunkArgs( {
					select: createSelect( {
						group: {
							lock: { move: true, remove: true },
							templateLock: 'all',
						},
						paragraph: { lock: { move: true, remove: true } },
					} ),
					dispatch,
				} )
			);

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'group', 'paragraph' ],
				{
					group: { lock: undefined, templateLock: undefined },
					paragraph: { lock: undefined },
				},
				{ uniqueByBlock: true }
			);
		} );

		it( 'leaves the layout of a pattern to the pattern', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'group' ], {
				move: false,
				remove: false,
				layout: false,
			} )(
				thunkArgs( {
					select: createSelect(
						{
							group: {
								lock: { move: true, remove: true },
								metadata: { patternName: 'core/hero' },
							},
						},
						{ patternLocked: [ 'group' ] }
					),
					dispatch,
				} )
			);

			// No `templateLock` or `metadata` change: detaching the pattern
			// is what unlocks its layout.
			expect(
				dispatch.updateBlockAttributes.mock.calls[ 0 ][ 1 ].group
			).toEqual( { lock: undefined } );
		} );

		it( 'keeps the blocks inside in a layout-locked block when unlocking movement', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'group' ], { move: false } )(
				thunkArgs( {
					select: createSelect( {
						group: {
							lock: { move: true, remove: true },
							templateLock: 'all',
						},
						paragraph: { lock: { move: true, remove: true } },
					} ),
					dispatch,
				} )
			);

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'group', 'paragraph' ],
				{
					group: { lock: { move: false, remove: true } },
					// No explicit `move: false`, which would let it out of the
					// layout lock of the group.
					paragraph: { lock: { remove: true } },
				},
				{ uniqueByBlock: true }
			);
		} );

		it( 'unlocks the styles of the blocks above when a block inside unlocks its styles', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'paragraph' ], { styles: false } )(
				thunkArgs( {
					select: createSelect( {
						root: { lock: { styles: true } },
						group: { lock: { move: true, styles: true } },
						paragraph: { lock: { styles: true } },
					} ),
					dispatch,
				} )
			);

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'paragraph', 'root', 'group' ],
				{
					paragraph: { lock: undefined },
					root: { lock: undefined },
					// The group keeps its other locks.
					group: { lock: { move: true } },
				},
				{ uniqueByBlock: true }
			);
		} );

		it( 'unlocks the layout of the parent when a block inside unlocks its movement', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'paragraph' ], { move: false } )(
				thunkArgs( {
					select: createSelect( {
						group: { templateLock: 'all' },
						paragraph: {},
					} ),
					dispatch,
				} )
			);

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'paragraph', 'group' ],
				{
					// No explicit unlock is needed once the group is unlocked.
					paragraph: { lock: undefined },
					group: { templateLock: undefined },
				},
				{ uniqueByBlock: true }
			);
		} );

		it( 'leaves the layout of a pattern when a block inside unlocks its movement', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'paragraph' ], { move: false } )(
				thunkArgs( {
					select: createSelect(
						{ group: { templateLock: 'all' }, paragraph: {} },
						{ patternLocked: [ 'group' ] }
					),
					dispatch,
				} )
			);

			expect(
				dispatch.updateBlockAttributes.mock.calls[ 0 ][ 1 ].group
			).toBeUndefined();
		} );

		it( 'keeps an explicit unlock when the parent stays template locked', () => {
			const dispatch = { updateBlockAttributes: vi.fn() };
			setBlocksLock( [ 'group' ], {
				move: false,
				remove: false,
				layout: false,
			} )(
				thunkArgs( {
					select: createSelect(
						{ group: { lock: { move: true, remove: true } } },
						{ rootTemplateLock: 'all' }
					),
					dispatch,
				} )
			);

			expect(
				dispatch.updateBlockAttributes.mock.calls[ 0 ][ 1 ].group.lock
			).toEqual( { move: false, remove: false } );
		} );

		it( 'stops a layout lock passed on from above when unlocking a block deep inside', () => {
			// A Group holding Columns, holding a Column, holding a Heading.
			// Each one locked, and each container with its own layout lock.
			const parents: Record< string, string | null > = {
				group: null,
				columns: 'group',
				column: 'columns',
				heading: 'column',
			};
			const children: Record< string, string[] > = {
				group: [ 'columns' ],
				columns: [ 'column' ],
				column: [ 'heading' ],
				heading: [],
			};
			const fullLock = { move: true, remove: true, styles: true };
			const attributes: Record< string, Record< string, any > > = {
				group: { lock: fullLock, templateLock: 'all' },
				columns: { lock: fullLock, templateLock: 'all' },
				column: { lock: fullLock, templateLock: 'all' },
				heading: { lock: fullLock },
			};
			const getClientIdsOfDescendants = ( ids: string[] ): string[] =>
				ids.flatMap( ( id ) => [
					...children[ id ],
					...getClientIdsOfDescendants( children[ id ] ),
				] );
			// Like the editor, a block without a template lock of its own
			// passes on the one of the block above it.
			const getTemplateLock = ( id: string | null ): unknown => {
				if ( ! id ) {
					return false;
				}
				return (
					attributes[ id ]?.templateLock ??
					getTemplateLock( parents[ id ] )
				);
			};
			const select = {
				getClientIdsOfDescendants,
				getBlockName: ( id: string ) =>
					id === 'heading' ? 'core/heading' : 'core/group',
				canLockBlockType: () => true,
				getBlockAttributes: ( id: string ) => attributes[ id ] ?? {},
				getBlockRootClientId: ( id: string ) => parents[ id ],
				getTemplateLock,
				canLayoutLockBlock: ( id: string ) => id !== 'heading',
				isPatternLockedBlock: () => false,
				canStylesLockBlock: () => true,
				isStylesLockedBlock: ( id: string ) =>
					!! attributes[ id ]?.lock?.styles,
				getBlockParents: ( id: string ) => {
					const ancestors: string[] = [];
					let parentId = parents[ id ];
					while ( parentId ) {
						ancestors.unshift( parentId );
						parentId = parents[ parentId ];
					}
					return ancestors;
				},
			};
			const dispatch = { updateBlockAttributes: vi.fn() };

			setBlocksLock( [ 'column' ], {
				move: false,
				remove: false,
				layout: false,
				styles: false,
			} )( thunkArgs( { select, dispatch } ) );

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'column', 'heading', 'group', 'columns' ],
				{
					// The Columns stop passing on the layout lock of the
					// Group, so the Column and the Heading need no lock.
					column: { lock: undefined, templateLock: undefined },
					heading: { lock: undefined },
					group: { lock: { move: true, remove: true } },
					columns: {
						lock: { move: true, remove: true },
						templateLock: false,
					},
				},
				{ uniqueByBlock: true }
			);
		} );
	} );
} );
