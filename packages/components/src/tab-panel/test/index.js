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
import { createRoot } from '@wordpress/element';

describe( 'TabPanel', () => {
	const elementClick = ( element ) => {
		TestUtils.Simulate.click( element );
		jest.runAllTimers();
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

			const container = document.createElement( 'div' );
			const root = createRoot( container );
			root.render( <TabPanel { ...props } /> );
			jest.runAllTimers();

			const alphaTab = container.querySelector( '.alpha' );
			const betaTab = container.querySelector( '.beta' );
			const gammaTab = container.querySelector( '.gamma' );

			const getAlphaViews = () =>
				container.querySelectorAll( '.alpha-view' );
			const getBetaViews = () =>
				container.querySelectorAll( '.beta-view' );
			const getGammaViews = () =>
				container.querySelectorAll( '.gamma-view' );

			const getActiveTab = () => container.querySelector( '.active-tab' );
			const getActiveView = () =>
				container.querySelector( '.components-tab-panel__tab-content' )
					.firstChild.textContent;

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

		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <TabPanel { ...props } /> );
		jest.runAllTimers();

		const getActiveTab = () => container.querySelector( '.active-tab' );
		expect( getActiveTab().innerHTML ).toBe( 'Beta' );
	} );
} );
