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
import Dashicon from '../../dashicon';
import Icon from '../';
import { Path, SVG } from '../../';

describe( 'Icon', () => {
	const className = 'example-class';
	const svg = (
		<SVG>
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	);
	const style = { fill: 'red' };

	it( 'renders nothing when icon omitted', () => {
		const wrapper = shallow( <Icon /> );

		expect( wrapper.type() ).toBeNull();
	} );

	it( 'renders a dashicon by slug', () => {
		const wrapper = shallow( <Icon icon="format-image" /> );

		expect( wrapper.find( 'Dashicon' ).prop( 'icon' ) ).toBe(
			'format-image'
		);
	} );

	it( 'renders a dashicon by slug and with a default size of 20', () => {
		const wrapper = shallow( <Icon icon="format-image" /> );

		expect( wrapper.find( 'Dashicon' ).prop( 'size' ) ).toBe( 20 );
	} );

	it( 'renders a dashicon by element and with a default size of 20', () => {
		const wrapper = shallow(
			<Icon icon={ <Dashicon icon="format-image" /> } />
		);

		expect( wrapper.find( 'Dashicon' ).prop( 'size' ) ).toBe( 20 );
	} );

	it( 'renders a function', () => {
		const wrapper = shallow( <Icon icon={ () => <span /> } /> );

		expect( wrapper.name() ).toBe( 'span' );
	} );

	it( 'renders an element', () => {
		const wrapper = shallow( <Icon icon={ <span /> } /> );

		expect( wrapper.name() ).toBe( 'span' );
	} );

	it( 'renders an svg element', () => {
		const wrapper = shallow( <Icon icon={ svg } /> );

		expect( wrapper.name() ).toBe( 'SVG' );
	} );

	it( 'renders an svg element with a default width and height of 24', () => {
		const wrapper = shallow( <Icon icon={ svg } /> );

		expect( wrapper.prop( 'width' ) ).toBe( 24 );
		expect( wrapper.prop( 'height' ) ).toBe( 24 );
	} );

	it( 'renders an svg element and passes the size as its width and height', () => {
		const wrapper = shallow(
			<Icon
				icon={
					<SVG width={ 64 } height={ 64 }>
						<Path d="M5 4v3h5.5v12h3V7H19V4z" />
					</SVG>
				}
				size={ 32 }
			/>
		);

		expect( wrapper.prop( 'width' ) ).toBe( 64 );
		expect( wrapper.prop( 'height' ) ).toBe( 64 );
	} );

	it( 'renders an svg element and does not override width and height if already specified', () => {
		const wrapper = shallow( <Icon icon={ svg } size={ 32 } /> );

		expect( wrapper.prop( 'width' ) ).toBe( 32 );
		expect( wrapper.prop( 'height' ) ).toBe( 32 );
	} );

	it( 'renders a component', () => {
		class MyComponent extends Component {
			render() {
				return <span />;
			}
		}
		const wrapper = shallow( <Icon icon={ MyComponent } /> );

		expect( wrapper.name() ).toBe( 'MyComponent' );
	} );

	describe( 'props passing', () => {
		class MyComponent extends Component {
			render() {
				return <span className={ this.props.className } />;
			}
		}

		describe.each( [
			[ 'dashicon', { icon: 'format-image' } ],
			[ 'dashicon element', { icon: <Dashicon icon="format-image" /> } ],
			[ 'element', { icon: <span /> } ],
			[ 'svg element', { icon: svg } ],
			[ 'component', { icon: MyComponent } ],
		] )( '%s', ( label, props ) => {
			it( 'should pass through size', () => {
				if ( label === 'svg element' ) {
					// Custom logic for SVG elements tested separately.
					//
					// See: `renders an svg element and passes the size as its width and height`
					return;
				}

				const wrapper = shallow( <Icon { ...props } size={ 32 } /> );

				expect( wrapper.prop( 'size' ) ).toBe( 32 );
			} );

			it( 'should pass through all other props', () => {
				const wrapper = shallow(
					<Icon
						{ ...props }
						style={ style }
						className={ className }
					/>
				);

				expect( wrapper.prop( 'style' ) ).toBe( style );
				expect( wrapper.prop( 'className' ) ).toBe( className );
			} );
		} );
	} );
} );
