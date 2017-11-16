/**
 * Internal dependencies
 */
import reducer, {
	requestMetaBoxUpdates,
	handleMetaBoxReload,
	metaBoxStateChanged,
	initializeMetaBoxState,
	getDirtyMetaBoxes,
	getMetaBoxes,
	getMetaBox,
	isMetaBoxStateDirty,
} from '../meta-boxes';

describe( 'metaBoxes', () => {
	describe( 'reducer', () => {
		it( 'should return default state', () => {
			const actual = reducer( undefined, {} );
			const expected = {
				normal: {
					isActive: false,
					isDirty: false,
					isUpdating: false,
				},
				side: {
					isActive: false,
					isDirty: false,
					isUpdating: false,
				},
			};

			expect( actual ).toEqual( expected );
		} );

		it( 'should set the sidebar to active', () => {
			const theMetaBoxes = {
				normal: false,
				advanced: false,
				side: true,
			};

			const action = {
				type: 'INITIALIZE_META_BOX_STATE',
				metaBoxes: theMetaBoxes,
			};

			const actual = reducer( undefined, action );
			const expected = {
				normal: {
					isActive: false,
					isDirty: false,
					isUpdating: false,
					isLoaded: false,
				},
				side: {
					isActive: true,
					isDirty: false,
					isUpdating: false,
					isLoaded: false,
				},
			};

			expect( actual ).toEqual( expected );
		} );

		it( 'should switch updating to off', () => {
			const action = {
				type: 'HANDLE_META_BOX_RELOAD',
				location: 'normal',
			};

			const theMetaBoxes = reducer( { normal: { isUpdating: true, isActive: false, isDirty: true } }, action );
			const actual = theMetaBoxes.normal;
			const expected = {
				isActive: false,
				isUpdating: false,
				isDirty: false,
			};

			expect( actual ).toEqual( expected );
		} );

		it( 'should switch updating to on', () => {
			const action = {
				type: 'REQUEST_META_BOX_UPDATES',
				locations: [ 'normal' ],
			};

			const theMetaBoxes = reducer( undefined, action );
			const actual = theMetaBoxes.normal;
			const expected = {
				isActive: false,
				isUpdating: true,
				isDirty: false,
			};

			expect( actual ).toEqual( expected );
		} );

		it( 'should return with the isDirty flag as true', () => {
			const action = {
				type: 'META_BOX_STATE_CHANGED',
				location: 'normal',
				hasChanged: true,
			};
			const theMetaBoxes = reducer( undefined, action );
			const actual = theMetaBoxes.normal;
			const expected = {
				isActive: false,
				isDirty: true,
				isUpdating: false,
			};

			expect( actual ).toEqual( expected );
		} );
	} );

	describe( 'action creators', () => {
		describe( 'requestMetaBoxUpdates', () => {
			it( 'should return the REQUEST_META_BOX_UPDATES action', () => {
				expect( requestMetaBoxUpdates( [ 'normal' ] ) ).toEqual( {
					type: 'REQUEST_META_BOX_UPDATES',
					locations: [ 'normal' ],
				} );
			} );
		} );

		describe( 'handleMetaBoxReload', () => {
			it( 'should return the HANDLE_META_BOX_RELOAD action with a location and node', () => {
				expect( handleMetaBoxReload( 'normal' ) ).toEqual( {
					type: 'HANDLE_META_BOX_RELOAD',
					location: 'normal',
				} );
			} );
		} );

		describe( 'metaBoxStateChanged', () => {
			it( 'should return the META_BOX_STATE_CHANGED action with a hasChanged flag', () => {
				expect( metaBoxStateChanged( 'normal', true ) ).toEqual( {
					type: 'META_BOX_STATE_CHANGED',
					location: 'normal',
					hasChanged: true,
				} );
			} );
		} );

		describe( 'initializeMetaBoxState', () => {
			it( 'should return the META_BOX_STATE_CHANGED action with a hasChanged flag', () => {
				const metaBoxes = {
					side: true,
					normal: true,
					advanced: false,
				};

				expect( initializeMetaBoxState( metaBoxes ) ).toEqual( {
					type: 'INITIALIZE_META_BOX_STATE',
					metaBoxes,
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		beforeEach( () => {
			getDirtyMetaBoxes.clear();
		} );

		describe( 'getDirtyMetaBoxes', () => {
			it( 'should return array of just the side location', () => {
				const state = {
					metaBoxes: {
						normal: {
							isActive: false,
							isDirty: false,
							isUpdating: false,
						},
						side: {
							isActive: true,
							isDirty: true,
							isUpdating: false,
						},
					},
				};

				expect( getDirtyMetaBoxes( state ) ).toEqual( [ 'side' ] );
			} );
		} );

		describe( 'getMetaBoxes', () => {
			it( 'should return the state of all meta boxes', () => {
				const state = {
					metaBoxes: {
						normal: {
							isDirty: false,
							isUpdating: false,
						},
						side: {
							isDirty: false,
							isUpdating: false,
						},
					},
				};

				expect( getMetaBoxes( state ) ).toEqual( {
					normal: {
						isDirty: false,
						isUpdating: false,
					},
					side: {
						isDirty: false,
						isUpdating: false,
					},
				} );
			} );
		} );

		describe( 'getMetaBox', () => {
			it( 'should return the state of selected meta box', () => {
				const state = {
					metaBoxes: {
						normal: {
							isActive: false,
							isDirty: false,
							isUpdating: false,
						},
						side: {
							isActive: true,
							isDirty: false,
							isUpdating: false,
						},
					},
				};

				expect( getMetaBox( state, 'side' ) ).toEqual( {
					isActive: true,
					isDirty: false,
					isUpdating: false,
				} );
			} );
		} );

		describe( 'isMetaBoxStateDirty', () => {
			it( 'should return false', () => {
				const state = {
					metaBoxes: {
						normal: {
							isActive: false,
							isDirty: false,
							isUpdating: false,
						},
						side: {
							isActive: false,
							isDirty: false,
							isUpdating: false,
						},
					},
				};

				expect( isMetaBoxStateDirty( state ) ).toEqual( false );
			} );

			it( 'should return false when a dirty meta box is not active.', () => {
				const state = {
					metaBoxes: {
						normal: {
							isActive: false,
							isDirty: true,
							isUpdating: false,
						},
						side: {
							isActive: false,
							isDirty: false,
							isUpdating: false,
						},
					},
				};

				expect( isMetaBoxStateDirty( state ) ).toEqual( false );
			} );

			it( 'should return false when both meta boxes are dirty but inactive.', () => {
				const state = {
					metaBoxes: {
						normal: {
							isActive: false,
							isDirty: true,
							isUpdating: false,
						},
						side: {
							isActive: false,
							isDirty: true,
							isUpdating: false,
						},
					},
				};

				expect( isMetaBoxStateDirty( state ) ).toEqual( false );
			} );

			it( 'should return false when a dirty meta box is active.', () => {
				const state = {
					metaBoxes: {
						normal: {
							isActive: true,
							isDirty: true,
							isUpdating: false,
						},
						side: {
							isActive: false,
							isDirty: false,
							isUpdating: false,
						},
					},
				};

				expect( isMetaBoxStateDirty( state ) ).toEqual( true );
			} );

			it( 'should return false when both meta boxes are dirty and active.', () => {
				const state = {
					metaBoxes: {
						normal: {
							isActive: true,
							isDirty: true,
							isUpdating: false,
						},
						side: {
							isActive: true,
							isDirty: true,
							isUpdating: false,
						},
					},
				};

				expect( isMetaBoxStateDirty( state ) ).toEqual( true );
			} );
		} );
	} );
} );
