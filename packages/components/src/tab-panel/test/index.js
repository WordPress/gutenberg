/**
 * External dependencies
 */
import TestUtils from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import TabPanel from '../';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

describe( 'TabPanel', () => {
	const getElementByClass = ( wrapper, className ) => {
		return TestUtils.findRenderedDOMComponentWithClass(
			wrapper,
			className
		);
	};

	const getElementsByClass = ( wrapper, className ) => {
		return TestUtils.scryRenderedDOMComponentsWithClass(
			wrapper,
			className
		);
	};

	const elementClick = ( element ) => {
		TestUtils.Simulate.click( element );
	};

	// This is needed because TestUtils does not accept a stateless component.
	// anything run through a HOC ends up as a stateless component.
	const getTestComponent = ( WrappedComponent, props ) => {
		class TestComponent extends Component {
			render() {
				return <WrappedComponent { ...props } />;
			}
		}
		return <TestComponent />;
	};

	describe( 'basic rendering', () => {
		it( 'should render a tabpanel, and clicking should change tabs', () => {
			const props = {
				className: 'test-panel',
				activeClass: 'active-tab',
				tabs: [
					{
						name: 'alpha',
						title: 'Alpha',
						className: 'alpha',
					},
					{
						name: 'beta',
						title: 'Beta',
						className: 'beta',
					},
					{
						name: 'gamma',
						title: 'Gamma',
						className: 'gamma',
					},
				],
				children: ( tab ) => {
					return (
						<p tabIndex="0" className={ tab.name + '-view' }>
							{ tab.name }
						</p>
					);
				},
			};

			let wrapper;
			TestUtils.act( () => {
				wrapper = TestUtils.renderIntoDocument(
					getTestComponent( TabPanel, props )
				);
			} );

			const alphaTab = getElementByClass( wrapper, 'alpha' );
			const betaTab = getElementByClass( wrapper, 'beta' );
			const gammaTab = getElementByClass( wrapper, 'gamma' );

			const getAlphaViews = () =>
				getElementsByClass( wrapper, 'alpha-view' );
			const getBetaViews = () =>
				getElementsByClass( wrapper, 'beta-view' );
			const getGammaViews = () =>
				getElementsByClass( wrapper, 'gamma-view' );

			const getActiveTab = () =>
				getElementByClass( wrapper, 'active-tab' );
			const getActiveView = () =>
				getElementByClass(
					wrapper,
					'components-tab-panel__tab-content'
				).firstChild.textContent;

			expect( getActiveTab().innerHTML ).toBe( 'Alpha' );
			expect( getAlphaViews() ).toHaveLength( 1 );
			expect( getBetaViews() ).toHaveLength( 0 );
			expect( getGammaViews() ).toHaveLength( 0 );
			expect( getActiveView() ).toBe( 'alpha' );

			elementClick( betaTab );

			expect( getActiveTab().innerHTML ).toBe( 'Beta' );
			expect( getAlphaViews() ).toHaveLength( 0 );
			expect( getBetaViews() ).toHaveLength( 1 );
			expect( getGammaViews() ).toHaveLength( 0 );
			expect( getActiveView() ).toBe( 'beta' );

			elementClick( betaTab );

			expect( getActiveTab().innerHTML ).toBe( 'Beta' );
			expect( getAlphaViews() ).toHaveLength( 0 );
			expect( getBetaViews() ).toHaveLength( 1 );
			expect( getGammaViews() ).toHaveLength( 0 );
			expect( getActiveView() ).toBe( 'beta' );

			elementClick( gammaTab );

			expect( getActiveTab().innerHTML ).toBe( 'Gamma' );
			expect( getAlphaViews() ).toHaveLength( 0 );
			expect( getBetaViews() ).toHaveLength( 0 );
			expect( getGammaViews() ).toHaveLength( 1 );
			expect( getActiveView() ).toBe( 'gamma' );

			elementClick( alphaTab );

			expect( getActiveTab().innerHTML ).toBe( 'Alpha' );
			expect( getAlphaViews() ).toHaveLength( 1 );
			expect( getBetaViews() ).toHaveLength( 0 );
			expect( getGammaViews() ).toHaveLength( 0 );
			expect( getActiveView() ).toBe( 'alpha' );
		} );
	} );

	it( 'should render with a tab initially selected by prop initialTabIndex', () => {
		const props = {
			className: 'test-panel',
			activeClass: 'active-tab',
			initialTabName: 'beta',
			tabs: [
				{
					name: 'alpha',
					title: 'Alpha',
					className: 'alpha',
				},
				{
					name: 'beta',
					title: 'Beta',
					className: 'beta',
				},
			],
			children: ( tab ) => {
				return (
					<p tabIndex="0" className={ tab.name + '-view' }>
						{ tab.name }
					</p>
				);
			},
		};

		let wrapper;
		TestUtils.act( () => {
			wrapper = TestUtils.renderIntoDocument(
				getTestComponent( TabPanel, props )
			);
		} );

		const getActiveTab = () => getElementByClass( wrapper, 'active-tab' );
		expect( getActiveTab().innerHTML ).toBe( 'Beta' );
	} );
} );
