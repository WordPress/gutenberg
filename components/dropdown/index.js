/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress Dependeencies
 */
import { Component } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal Dependencies
 */
import Popover from '../popover';
import FocusOutside from '../focus-outside';

const {
	ENTER,
	SPACE,
	DOWN,
} = keycodes;

/**
 * Set of keys on which focus should shift to menu tabbable.
 *
 * @type {number[]}
 */
const FOCUS_MENU_KEYCODES = [ ENTER, SPACE, DOWN ];

class Dropdown extends Component {
	constructor() {
		super( ...arguments );

		this.bindPopover = this.bindPopover.bind( this );
		this.toggle = this.toggle.bind( this );
		this.close = this.close.bind( this );
		this.focusPopoverTabbable = this.focusPopoverTabbable.bind( this );

		this.state = {
			isOpen: false,
			focusFirstTabbable: false,
		};
	}

	componentWillUnmount() {
		const { isOpen } = this.state;
		const { onToggle } = this.props;
		if ( isOpen && onToggle ) {
			onToggle( false );
		}
	}

	componentWillUpdate( nextProps, nextState ) {
		const { isOpen } = nextState;
		const { onToggle } = nextProps;
		if ( this.state.isOpen !== isOpen && onToggle ) {
			onToggle( isOpen );
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		const { isOpen, focusFirstTabbable } = this.state;
		if ( isOpen && ! prevState.isOpen && focusFirstTabbable ) {
			this.popover.focusFirstTabbable();
		}
	}

	/**
	 * Binds the popover component instance. Keying into menu will call its
	 * focusFirstTabbable instance method.
	 *
	 * @param {Object} popover Popover instance.
	 */
	bindPopover( popover ) {
		this.popover = popover;
	}

	/**
	 * Toggles display of the dropdown menu options. By default, toggles to the
	 * inverse of the current state. Optionally focus first tabbable upon menu
	 * opening.
	 *
	 * @param {?boolean} isOpen             Whether menu is to be visible.
	 * @param {?boolean} focusFirstTabbable Whether to focus first tabbable.
	 */
	toggle( isOpen, focusFirstTabbable = false ) {
		this.setState( ( state ) => {
			if ( isOpen === undefined ) {
				isOpen = ! state.isOpen;
			}

			if ( ! isOpen ) {
				focusFirstTabbable = false;
			}

			return { isOpen, focusFirstTabbable };
		} );
	}

	close() {
		this.setState( {
			isOpen: false,
			focusFirstTabbable: false,
		} );
	}

	/**
	 * On key down, shifts focus into menu if one of menu focus keycodes. Opens
	 * menu if not already open.
	 *
	 * @param {KeyboardEvent} event Key down event.
	 */
	focusPopoverTabbable( event ) {
		if ( ! includes( FOCUS_MENU_KEYCODES, event.keyCode ) ) {
			return;
		}

		if ( this.state.isOpen ) {
			this.popover.focusFirstTabbable();
		} else {
			this.toggle( true, true );
		}

		// Consider this key handled, since otherwise the behavior of other
		// handlers may conflict with intended focus.
		event.stopPropagation();

		// Prevent scroll on arrow press.
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
		}
	}

	render() {
		const { isOpen } = this.state;
		const {
			renderContent,
			renderToggle,
			position = 'bottom',
			className,
			contentClassName,
			expandOnMobile,
			headerTitle,
		} = this.props;

		const args = { isOpen, onToggle: this.toggle, onClose: this.close };

		// Disable reason: The toggle wrapper is not a button. The implementing
		// developer is expected to return a button from `renderToggle`, but
		// capture bubbling key events here to ensure focus shifts into.

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div className={ className }>
				<FocusOutside onFocusOutside={ this.close }>
					<div onKeyDown={ this.focusPopoverTabbable }>
						{ renderToggle( args ) }
					</div>
					{ isOpen && (
						<Popover
							ref={ this.bindPopover }
							className={ contentClassName }
							position={ position }
							onClose={ this.close }
							expandOnMobile={ expandOnMobile }
							headerTitle={ headerTitle }
							focusOnMount={ false }
						>
							{ renderContent( args ) }
						</Popover>
					) }
				</FocusOutside>
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default Dropdown;
