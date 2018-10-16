/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RawIcon from '../';

describe( 'RawIcon', () => {
	const className = 'example-class';
	const svg = <svg><path d="M5 4v3h5.5v12h3V7H19V4z" /></svg>;

	it( 'renders nothing when icon omitted', () => {
		const wrapper = shallow( <RawIcon /> );

		expect( wrapper.type() ).toBeNull();
	} );

	it( 'renders a dashicon by slug', () => {
		const wrapper = shallow( <RawIcon icon="format-image" /> );

		expect( wrapper.find( 'Dashicon' ).prop( 'icon' ) ).toBe( 'format-image' );
	} );

	it( 'renders a dashicon and passes the classname to it', () => {
		const wrapper = shallow( <RawIcon icon="format-image" className={ className } /> );

		expect( wrapper.find( 'Dashicon' ).prop( 'className' ) ).toBe( 'example-class' );
	} );

	it( 'renders a dashicon and passes the size to it', () => {
		const wrapper = shallow( <RawIcon icon="format-image" size={ 32 } /> );

		expect( wrapper.find( 'Dashicon' ).prop( 'size' ) ).toBe( 32 );
	} );

	it( 'renders a function', () => {
		const wrapper = shallow( <RawIcon icon={ () => <span /> } /> );

		expect( wrapper.name() ).toBe( 'span' );
	} );

	it( 'renders an element', () => {
		const wrapper = shallow( <RawIcon icon={ <span /> } /> );

		expect( wrapper.name() ).toBe( 'span' );
	} );

	it( 'renders an element and passes the classname to it', () => {
		const wrapper = shallow( <RawIcon icon={ <span /> } className={ className } /> );

		expect( wrapper.prop( 'className' ) ).toBe( 'example-class' );
	} );

	it( 'renders an element and passes the size to it', () => {
		const wrapper = shallow( <RawIcon icon="format-image" size={ 32 } /> );

		expect( wrapper.prop( 'size' ) ).toBe( 32 );
	} );

	it( 'renders an svg element', () => {
		const wrapper = shallow( <RawIcon icon={ svg } /> );

		expect( wrapper.name() ).toBe( 'SVG' );
	} );

	it( 'renders an svg element and passes the classname to it', () => {
		const wrapper = shallow( <RawIcon icon={ svg } className={ className } /> );

		expect( wrapper.prop( 'className' ) ).toBe( 'example-class' );
	} );

	it( 'renders an svg element and passes the size as its width and height', () => {
		const wrapper = shallow( <RawIcon icon={ <svg width={ 64 } height={ 64 }><path d="M5 4v3h5.5v12h3V7H19V4z" /></svg> } size={ 32 } /> );

		expect( wrapper.prop( 'width' ) ).toBe( 64 );
		expect( wrapper.prop( 'height' ) ).toBe( 64 );
	} );

	it( 'renders an svg element and does not override width and height if already specified', () => {
		const wrapper = shallow( <RawIcon icon={ svg } size={ 32 } /> );

		expect( wrapper.prop( 'width' ) ).toBe( 32 );
		expect( wrapper.prop( 'height' ) ).toBe( 32 );
	} );

	it( 'renders a component', () => {
		class MyComponent extends Component {
			render() {
				return <span />;
			}
		}
		const wrapper = shallow(
			<RawIcon icon={ MyComponent } />
		);

		expect( wrapper.name() ).toBe( 'MyComponent' );
	} );

	it( 'renders a component and passes the classname to it', () => {
		class MyComponent extends Component {
			render( ) {
				return <span className={ this.props.className } />;
			}
		}
		const wrapper = shallow(
			<RawIcon icon={ MyComponent } className={ className } />
		);

		expect( wrapper.prop( 'className' ) ).toBe( 'example-class' );
	} );

	it( 'renders a component and passes the size to it', () => {
		class MyComponent extends Component {
			render( ) {
				return <span size={ this.props.size } />;
			}
		}
		const wrapper = shallow(
			<RawIcon icon={ MyComponent } size={ 32 } />
		);

		expect( wrapper.prop( 'size' ) ).toBe( 32 );
	} );
} );
