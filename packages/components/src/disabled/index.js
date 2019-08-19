/**
 * External dependencies
 */
import { includes, debounce, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createContext, Component } from '@wordpress/element';
import { focus } from '@wordpress/dom';

const { Consumer, Provider } = createContext( false );

/**
 * Names of control nodes which qualify for disabled behavior.
 *
 * See WHATWG HTML Standard: 4.10.18.5: "Enabling and disabling form controls: the disabled attribute".
 *
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#enabling-and-disabling-form-controls:-the-disabled-attribute
 *
 * @type {string[]}
 */
const DISABLED_ELIGIBLE_NODE_NAMES = [
	'BUTTON',
	'FIELDSET',
	'INPUT',
	'OPTGROUP',
	'OPTION',
	'SELECT',
	'TEXTAREA',
];

class Disabled extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
		this.disable = this.disable.bind( this );
		this.catchEvents = this.catchEvents.bind( this );

		// Debounce re-disable since disabling process itself will incur
		// additional mutations which should be ignored.
		this.debouncedDisable = debounce( this.disable, { leading: true } );
	}

	componentDidMount() {
		this.disable();

		this.observer = new window.MutationObserver( this.debouncedDisable );
		this.observer.observe( this.node, {
			childList: true,
			attributes: true,
			subtree: true,
		} );

		this.node.addEventListener( 'click', this.catchEvents );
		this.node.addEventListener( 'focus', this.catchEvents );
	}

	componentWillUnmount() {
		this.observer.disconnect();
		this.debouncedDisable.cancel();
		this.node.removeEventListener( 'click', this.catchEvents );
		this.node.removeEventListener( 'focus', this.catchEvents );
	}

	catchEvents( e ) {
		e.preventDefault();
		e.stopPropagation();
	}

	bindNode( node ) {
		this.node = node;
	}

	disable() {
		const {
			onDisable = noop,
			eligibleNodeNames = DISABLED_ELIGIBLE_NODE_NAMES,
		} = this.props;

		const focusableNodes = focus.focusable.find( this.node );

		focusableNodes.forEach( ( focusable ) => {
			if ( includes( eligibleNodeNames, focusable.nodeName ) ) {
				focusable.setAttribute( 'disabled', '' );
			}

			if ( focusable.hasAttribute( 'contenteditable' ) ) {
				focusable.setAttribute( 'contenteditable', 'false' );
			}

			// Make it impossible to focus or tab to `<a>` or `<area>` els
			if ( focusable.hasAttribute( 'href' ) ) {
				focusable.removeAttribute( 'href' );
			}

			// Disable all nodes from being tabbable order
			focusable.setAttribute( 'tabindex', '-1' );
		} );

		onDisable( focusableNodes );
	}

	render() {
		const { className, ...props } = this.props;
		return (
			<Provider value={ true }>
				<div
					ref={ this.bindNode }
					className={ classnames( className, 'components-disabled' ) }
					{ ...props }
				>
					{ this.props.children }
				</div>
			</Provider>
		);
	}
}

Disabled.Consumer = Consumer;

export default Disabled;
