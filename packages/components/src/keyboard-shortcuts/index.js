/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Children } from '@wordpress/element';

function throwForInvalidCombination( combination ) {
	const keys = combination.split( '+' );
	const modifiers = new Set( keys.filter( ( value ) => value.length > 1 ) );
	const hasAlt = modifiers.has( 'alt' );
	const hasShift = modifiers.has( 'shift' );

	if (
		( modifiers.size === 1 && hasAlt ) ||
		( modifiers.size === 2 && hasAlt && hasShift )
	) {
		throw new Error( `Cannot bind ${ combination }. Alt and Shift+Alt modifiers are reserved for character input.` );
	}
}

class KeyboardShortcuts extends Component {
	constructor() {
		super( ...arguments );

		this.bindKeyTarget = this.bindKeyTarget.bind( this );
	}

	componentDidMount() {
		const { keyTarget = document } = this;

		this.mousetrap = new Mousetrap( keyTarget );

		forEach( this.props.shortcuts, ( callback, key ) => {
			if ( process.env.NODE_ENV === 'development' ) {
				throwForInvalidCombination( key );
			}

			const { bindGlobal, eventName } = this.props;
			const bindFn = bindGlobal ? 'bindGlobal' : 'bind';
			this.mousetrap[ bindFn ]( key, callback, eventName );
		} );
	}

	componentWillUnmount() {
		this.mousetrap.reset();
	}

	/**
	 * When rendering with children, binds the wrapper node on which events
	 * will be bound.
	 *
	 * @param {Element} node Key event target.
	 */
	bindKeyTarget( node ) {
		this.keyTarget = node;
	}

	render() {
		// Render as non-visual if there are no children pressed. Keyboard
		// events will be bound to the document instead.
		const { children } = this.props;
		if ( ! Children.count( children ) ) {
			return null;
		}

		return <div ref={ this.bindKeyTarget }>{ children }</div>;
	}
}

export default KeyboardShortcuts;
