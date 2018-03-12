/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import Popover from '../';

describe( 'Popover', () => {
	describe( '#componentDidUpdate()', () => {
		let wrapper;
		beforeEach( () => {
			jest.spyOn( Popover.prototype, 'toggleWindowEvents' ).mockImplementation( noop );
			jest.spyOn( Popover.prototype, 'setOffset' ).mockImplementation( noop );
			jest.spyOn( Popover.prototype, 'setForcedPositions' ).mockImplementation( noop );

			wrapper = shallow(
				<Popover />,
				{ lifecycleExperimental: true }
			);
		} );

		afterEach( () => {
			jest.restoreAllMocks();
		} );

		it( 'should add window events', () => {
			expect( Popover.prototype.toggleWindowEvents ).toHaveBeenCalledWith( true );
			expect( Popover.prototype.setOffset ).toHaveBeenCalled();
			expect( Popover.prototype.setForcedPositions ).toHaveBeenCalled();
		} );

		it( 'should remove window events', () => {
			wrapper.unmount();

			expect( Popover.prototype.toggleWindowEvents ).toHaveBeenCalledWith( false );
		} );

		it( 'should set offset and forced positions on changed position', () => {
			jest.clearAllMocks();

			wrapper.setProps( { position: 'bottom right' } );

			expect( Popover.prototype.toggleWindowEvents ).not.toHaveBeenCalled();
			expect( Popover.prototype.setOffset ).toHaveBeenCalled();
			expect( Popover.prototype.setForcedPositions ).toHaveBeenCalled();
		} );

		it( 'should set offset on changed forced positions', () => {
			jest.clearAllMocks();

			wrapper.setState( { forcedXAxis: 'left' } );

			expect( Popover.prototype.toggleWindowEvents ).not.toHaveBeenCalled();
			expect( Popover.prototype.setOffset ).toHaveBeenCalled();
			expect( Popover.prototype.setForcedPositions ).not.toHaveBeenCalled();
		} );

		it( 'should focus when opening', () => {
			// An ideal test here would mount with an input child and focus the
			// child, but in context of JSDOM the inputs are not visible and
			// are therefore skipped as tabbable, defaulting to popover.
			wrapper = mount( <Popover /> );

			const content = wrapper.find( '.components-popover__content' ).getDOMNode();

			expect( document.activeElement ).toBe( content );
		} );

		it( 'should allow focus-on-open behavior to be disabled', () => {
			const activeElement = document.activeElement;

			wrapper = mount( <Popover focusOnMount={ false } /> );

			expect( document.activeElement ).toBe( activeElement );
		} );
	} );

	describe( '#getPositions()', () => {
		it( 'should default to top center', () => {
			const instance = new Popover( {} );

			expect( instance.getPositions() ).toEqual( [ 'top', 'center' ] );
		} );

		it( 'should use y axis', () => {
			const instance = new Popover( { position: 'bottom' } );

			expect( instance.getPositions() ).toEqual( [ 'bottom', 'center' ] );
		} );

		it( 'should use y and x axis', () => {
			const instance = new Popover( { position: 'bottom right' } );

			expect( instance.getPositions() ).toEqual( [ 'bottom', 'right' ] );
		} );
	} );

	describe( '#setForcedPositions()', () => {
		function getInstanceWithContentBounds( contentNodeBounds, anchorNodeBounds = {} ) {
			const instance = new Popover( {} );

			instance.nodes.content = {
				getBoundingClientRect() {
					return {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
						...contentNodeBounds,
					};
				},
			};

			instance.getAnchorRect = () => ( {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0,
				...anchorNodeBounds,
			} );

			instance.setState = jest.fn();

			return instance;
		}

		it( 'should do nothing if all is well', () => {
			const instance = getInstanceWithContentBounds( {} );
			instance.setForcedPositions();

			expect( instance.setState ).not.toHaveBeenCalled();
		} );

		it( 'should flip y axis to bottom if exceeding top', () => {
			const instance = getInstanceWithContentBounds(
				{ top: -1, bottom: 9, height: 20 },
				{ top: 5, bottom: 10, height: 5 }
			);
			instance.setForcedPositions();

			expect( instance.setState ).toHaveBeenCalledTimes( 1 );
			expect( instance.setState ).toHaveBeenCalledWith( {
				forcedYAxis: 'bottom',
			} );
		} );

		it( 'should flip y axis to top if exceeding bottom', () => {
			const instance = getInstanceWithContentBounds(
				{ bottom: window.innerHeight + 1, height: 20 },
				{ top: 30, bottom: window.innerHeight - 10, height: window.innerHeight - 20 }
			);
			instance.setForcedPositions();

			expect( instance.setState ).toHaveBeenCalledTimes( 1 );
			expect( instance.setState ).toHaveBeenCalledWith( {
				forcedYAxis: 'top',
			} );
		} );

		it( 'should flip x axis to right if exceeding left', () => {
			const instance = getInstanceWithContentBounds(
				{ left: -1, right: 9, width: 20 },
				{ left: 5, right: 10, width: 5 }
			);
			instance.setForcedPositions();

			expect( instance.setState ).toHaveBeenCalledTimes( 1 );
			expect( instance.setState ).toHaveBeenCalledWith( {
				forcedXAxis: 'right',
			} );
		} );

		it( 'should flip x axis to left if exceeding right', () => {
			const instance = getInstanceWithContentBounds(
				{ right: window.innerWidth + 1, width: 20 },
				{ left: 30, right: window.innerWidth - 10, width: window.innerWidth - 20 }
			);
			instance.setForcedPositions();

			expect( instance.setState ).toHaveBeenCalledTimes( 1 );
			expect( instance.setState ).toHaveBeenCalledWith( {
				forcedXAxis: 'left',
			} );
		} );

		it( 'should flip x and y axis', () => {
			const instance = getInstanceWithContentBounds(
				{ top: -1, bottom: 9, height: 20, left: -1, right: 9, width: 20 },
				{ top: 5, bottom: 10, height: 5, left: 5, right: 10, width: 5 },
			);
			instance.setForcedPositions();

			expect( instance.setState ).toHaveBeenCalledTimes( 2 );
			expect( instance.setState ).toHaveBeenCalledWith( {
				forcedXAxis: 'right',
			} );
			expect( instance.setState ).toHaveBeenCalledWith( {
				forcedYAxis: 'bottom',
			} );
		} );
	} );

	describe( '#setOffset()', () => {
		let getComputedStyle;
		beforeEach( () => {
			getComputedStyle = window.getComputedStyle;
			window.getComputedStyle = jest.fn().mockReturnValue( {
				paddingTop: 10,
				paddingBottom: 5,
			} );
		} );

		afterEach( () => {
			window.getComputedStyle = getComputedStyle;
		} );

		function getInstanceWithParentNode() {
			const instance = new Popover( {} );

			instance.nodes.anchor = {
				parentNode: {
					getBoundingClientRect() {
						return {
							top: 200,
							right: 400,
							bottom: 400,
							left: 200,
							width: 50,
							height: 50,
						};
					},
				},
			};

			instance.nodes.popover = {
				style: {},
			};

			return instance;
		}

		it( 'should position at parent node center', () => {
			const instance = getInstanceWithParentNode();

			instance.setOffset();

			expect( instance.nodes.popover.style ).toEqual( {
				left: '225px',
				top: '210px',
				right: 'auto',
				bottom: 'auto',
			} );
		} );

		it( 'should position at parent bottom', () => {
			const instance = getInstanceWithParentNode();
			instance.getPositions = jest.fn().mockReturnValue( [ 'bottom', 'center' ] );

			instance.setOffset();

			expect( instance.nodes.popover.style ).toEqual( {
				left: '225px',
				top: '395px',
				right: 'auto',
				bottom: 'auto',
			} );
		} );
	} );

	describe( '#render()', () => {
		it( 'should render content', () => {
			const wrapper = shallow( <Popover>Hello</Popover>, { disableLifecycleMethods: true } );

			expect( wrapper.type() ).toBe( 'span' );
			expect( wrapper.find( '.components-popover__content' ).prop( 'children' ) ).toBe( 'Hello' );
		} );

		it( 'should pass additional to portaled element', () => {
			const wrapper = shallow( <Popover role="tooltip">Hello</Popover>, { disableLifecycleMethods: true } );

			expect( wrapper.find( '.components-popover' ).prop( 'role' ) ).toBe( 'tooltip' );
		} );
	} );
} );
