/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import TabPanel from '../';

describe( 'TabPanel', () => {
	describe( 'basic rendering', () => {
		it( 'should render a tabpanel, and clicking should change tabs', () => {
			const wrapper = mount(
				<TabPanel className="test-panel"
					activeClass="active-tab"
					tabs={
						[
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
						]
					}
				>
					{
						( tab ) => {
							return (
								<div tabIndex="0" className={ tab.name + '-view' }>
									<h3 tabIndex="0" className={ tab.name + '-title' }>{ tab.title }</h3>
									<p tabIndex="0" className={ tab.name + '-text' }>{ tab.name }</p>
								</div>
							);
						}
					}
				</TabPanel>
			);

			const alphaTab = wrapper.find( 'button.alpha' );
			const betaTab = wrapper.find( 'button.beta' );
			const gammaTab = wrapper.find( 'button.gamma' );

			const getAlphaTitle = () => wrapper.find( 'h3.alpha-title' );
			const getBetaTitle = () => wrapper.find( 'h3.beta-title' );
			const getGammaTitle = () => wrapper.find( 'h3.gamma-title' );

			const getAlphaText = () => wrapper.find( 'p.alpha-text' );
			const getBetaText = () => wrapper.find( 'p.beta-text' );
			const getGammaText = () => wrapper.find( 'p.gamma-text' );

			const getActiveTab = () => wrapper.find( 'button.active-tab' );
			const getActiveText = () => wrapper.find( 'div[role="tabpanel"] p' );
			const getActiveTitle = () => wrapper.find( 'div[role="tabpanel"] h3' );

			expect( getActiveTab().text() ).toBe( 'Alpha' );
			expect( getAlphaText() ).toHaveLength( 1 );
			expect( getBetaText() ).toHaveLength( 0 );
			expect( getGammaText() ).toHaveLength( 0 );
			expect( getAlphaTitle() ).toHaveLength( 1 );
			expect( getBetaTitle() ).toHaveLength( 0 );
			expect( getGammaTitle() ).toHaveLength( 0 );
			expect( getActiveTitle().text() ).toBe( 'Alpha' );
			expect( getActiveText().text() ).toBe( 'alpha' );

			betaTab.simulate( 'click' );
			expect( getActiveTab().text() ).toBe( 'Beta' );
			expect( getAlphaText() ).toHaveLength( 0 );
			expect( getBetaText() ).toHaveLength( 1 );
			expect( getGammaText() ).toHaveLength( 0 );
			expect( getAlphaTitle() ).toHaveLength( 0 );
			expect( getBetaTitle() ).toHaveLength( 1 );
			expect( getGammaTitle() ).toHaveLength( 0 );
			expect( getActiveTitle().text() ).toBe( 'Beta' );
			expect( getActiveText().text() ).toBe( 'beta' );

			betaTab.simulate( 'click' );
			expect( getActiveTab().text() ).toBe( 'Beta' );
			expect( getAlphaText() ).toHaveLength( 0 );
			expect( getBetaText() ).toHaveLength( 1 );
			expect( getGammaText() ).toHaveLength( 0 );
			expect( getAlphaTitle() ).toHaveLength( 0 );
			expect( getBetaTitle() ).toHaveLength( 1 );
			expect( getGammaTitle() ).toHaveLength( 0 );
			expect( getActiveTitle().text() ).toBe( 'Beta' );
			expect( getActiveText().text() ).toBe( 'beta' );

			gammaTab.simulate( 'click' );
			expect( getActiveTab().text() ).toBe( 'Gamma' );
			expect( getAlphaText() ).toHaveLength( 0 );
			expect( getBetaText() ).toHaveLength( 0 );
			expect( getGammaText() ).toHaveLength( 1 );
			expect( getAlphaTitle() ).toHaveLength( 0 );
			expect( getBetaTitle() ).toHaveLength( 0 );
			expect( getGammaTitle() ).toHaveLength( 1 );
			expect( getActiveTitle().text() ).toBe( 'Gamma' );
			expect( getActiveText().text() ).toBe( 'gamma' );

			alphaTab.simulate( 'click' );
			expect( getActiveTab().text() ).toBe( 'Alpha' );
			expect( getAlphaText() ).toHaveLength( 1 );
			expect( getBetaText() ).toHaveLength( 0 );
			expect( getGammaText() ).toHaveLength( 0 );
			expect( getAlphaTitle() ).toHaveLength( 1 );
			expect( getBetaTitle() ).toHaveLength( 0 );
			expect( getGammaTitle() ).toHaveLength( 0 );
			expect( getActiveTitle().text() ).toBe( 'Alpha' );
			expect( getActiveText().text() ).toBe( 'alpha' );
		} );
	} );
} );
