/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { Component } from '../';
import serialize from '../serialize';

describe( 'serialize', () => {
	it( 'should render with context', () => {
		class Provider extends Component {
			getChildContext() {
				return {
					greeting: 'Hello!',
				};
			}

			render() {
				return this.props.children;
			}
		}

		Provider.childContextTypes = {
			greeting: noop,
		};

		// NOTE: Technically, a component should only receive context if it
		// explicitly defines `contextTypes`. This requirement is ignored in
		// our implementation.

		function FunctionComponent( props, context ) {
			return 'FunctionComponent: ' + context.greeting;
		}

		class ClassComponent extends Component {
			render() {
				return 'ClassComponent: ' + this.context.greeting;
			}
		}

		const result = serialize(
			<Provider>
				<FunctionComponent />
				<ClassComponent />
			</Provider>
		);

		expect( result ).toBe(
			'FunctionComponent: Hello!' +
			'ClassComponent: Hello!'
		);
	} );
} );
