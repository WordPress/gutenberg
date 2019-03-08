/**
 * External dependencies
 */
import { cond, matchesProperty, omit, last, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { NavigableMenu, KeyboardShortcuts } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { ESCAPE } from '@wordpress/keycodes';

class NavigableToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.focusToolbar = this.focusToolbar.bind( this );
		this.restoreFocus = this.restoreFocus.bind( this );
		this.resetNavigableStack = this.resetNavigableStack.bind( this );

		this.switchOnKeyDown = cond( [
			[ matchesProperty( [ 'keyCode' ], ESCAPE ), this.restoreFocus ],
		] );
		this.toolbar = createRef();
	}

	componentDidMount() {
		NavigableToolbar.registry.set( this.props.scopeId, this );

		if ( this.props.focusOnMount ) {
			this.focusToolbar();
		}
	}

	componentWillUnmount() {
		NavigableToolbar.registry.delete( this.props.scopeId );
	}

	/**
	 * Shifts focus to the first tabbable element within the toolbar container,
	 * if one exists.
	 */
	focusToolbar() {
		const tabbables = focus.tabbable.find( this.toolbar.current );
		if ( ! tabbables.length ) {
			return;
		}

		// Track the original active element prior to shifting focus, so that
		// focus can be returned if the user presses Escape while in toolbar.
		// Avoid if toolbar was focused as a result of `restoreFocus` popping
		// the stack, as otherwise it will record the wrong original active
		// element (the one from the prior toolbar) or will cause focus to
		// become stuck within the toolbar (the toolbar will repeatedly add
		// itself to the stack).
		if ( ! includes( NavigableToolbar.stack, this ) ) {
			this.activeElementBeforeFocus = document.activeElement;
			NavigableToolbar.stack.push( this );
		}

		tabbables[ 0 ].focus();
	}

	/**
	 * Restores focus to the toolbar or active element at the time focus was
	 * programattically shifted to the toolbar, if one exists.
	 */
	restoreFocus() {
		NavigableToolbar.stack.pop();

		if ( NavigableToolbar.stack.length ) {
			last( NavigableToolbar.stack ).focusToolbar();
		} else if ( this.activeElementBeforeFocus ) {
			this.activeElementBeforeFocus.focus();
			delete this.activeElementBeforeFocus;
		}
	}

	/**
	 * Resets the navigable toolbar context stack upon user focus shifting
	 * elsewhere in the application.
	 */
	resetNavigableStack() {
		// If blur occurs by result of pressing Escape, the instance will have
		// already been removed from the stack via `Array#pop`. Thus, the
		// condition here will be satisfied only in the case that focus shifts
		// as the result of another user interaction.
		if ( last( NavigableToolbar.stack ) === this ) {
			NavigableToolbar.stack = [];
			delete this.activeElementBeforeFocus;
		}
	}

	render() {
		const {
			children,
			// Disable reason: NavigableMenu will pass through props received
			// to its rendered element. Avoid including NavigableToolbar's
			// `scopeId` in destructured props.
			/* eslint-disable no-unused-vars */
			scopeId,
			/* eslint-enable no-unused-vars */
			...props
		} = this.props;

		return (
			<NavigableMenu
				orientation="horizontal"
				role="toolbar"
				ref={ this.toolbar }
				onKeyDown={ this.switchOnKeyDown }
				{ ...omit( props, [
					'focusOnMount',
				] ) }
				onBlur={ this.resetNavigableStack }
			>
				{ children }
			</NavigableMenu>
		);
	}
}

/**
 * An array of NavigableToolbar instances representing the current stack of
 * focus history, used in traversing backwards through focused toolbars as a
 * user presses Escape.
 *
 * @type {Array}
 */
NavigableToolbar.stack = [];

/**
 * Map of NavigableToolbar instances, keyed by scopeId.
 *
 * @type {Map}
 */
NavigableToolbar.registry = new Map;

NavigableToolbar.KeybindScope = class extends Component {
	constructor() {
		super( ...arguments );

		this.focusToolbar = this.focusToolbar.bind( this );
	}

	/**
	 * Invokes `focusToolbar` on the `NavigableToolbar` instance corresponding
	 * to the scope's own `scopeId` prop, if one exists.
	 */
	focusToolbar() {
		const toolbar = NavigableToolbar.registry.get( this.props.scopeId );
		if ( toolbar ) {
			toolbar.focusToolbar();
		}

		if ( this.props.onFocusToolbar ) {
			this.props.onFocusToolbar();
		}
	}

	render() {
		return (
			<KeyboardShortcuts
				bindGlobal
				ignoreChildHandled
				eventName="keydown"
				shortcuts={ {
					'alt+f10': this.focusToolbar,
				} }
				{ ...omit( this.props, [ 'scopeId' ] ) }
			/>
		);
	}
};

export default NavigableToolbar;
