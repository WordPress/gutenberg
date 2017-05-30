/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import PanelHeader from '../header.js';

describe( 'PanelHeader', () => {
	describe( 'basic rendering', () => {
		it( 'should render PanelHeader with empty div inside', () => {
			const panelHeader = shallow( <PanelHeader /> );
			expect( panelHeader.hasClass( 'components-panel__header' ) ).to.be.true();
			expect( panelHeader.type() ).to.equal( 'div' );
			expect( panelHeader.find( 'div' ).shallow().children().length ).to.equal( 0 );
		} );

		it( 'should render a label matching the text provided in the prop', () => {
			const panelHeader = shallow( <PanelHeader label="Some Text" /> );
			const label = panelHeader.find( 'strong' ).shallow();
			expect( label.text() ).to.equal( 'Some Text' );
			expect( label.type() ).to.equal( 'strong' );
		} );

		it( 'should render child elements in the panel header body when provided', () => {
			const panelHeader = shallow( <PanelHeader children="Some Text" /> );
			expect( panelHeader.instance().props.children ).to.equal( 'Some Text' );
			expect( panelHeader.text() ).to.equal( 'Some Text' );
		} );

		it( 'should render both child elements and label when passed in', () => {
			const panelHeader = shallow( <PanelHeader label="Some Label" children="Some Text" /> );
			expect( panelHeader.find( 'div' ).shallow().children().length ).to.equal( 2 );
		} );
	} );
} );
