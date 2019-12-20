/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../popover';

class Dropdown extends Component {
	constructor() {
		super( ...arguments );

		this.toggle = this.toggle.bind( this );
		this.close = this.close.bind( this );
		this.closeIfFocusOutside = this.closeIfFocusOutside.bind( this );

		this.containerRef = createRef();

		this.state = {
			isOpen: false,
		};
	}

	componentWillUnmount() {
		const { isOpen } = this.state;
		const { onToggle } = this.props;
		if ( isOpen && onToggle ) {
			onToggle( false );
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		const { isOpen } = this.state;
		const { onToggle } = this.props;
		if ( prevState.isOpen !== isOpen && onToggle ) {
			onToggle( isOpen );
		}
	}

	toggle() {
		this.setState( ( state ) => ( {
			isOpen: ! state.isOpen,
		} ) );
	}

	/**
	 * Closes the dropdown if a focus leaves the dropdown wrapper. This is
	 * intentionally distinct from `onClose` since focus loss from the popover
	 * is expected to occur when using the Dropdown's toggle button, in which
	 * case the correct behavior is to keep the dropdown closed. The same applies
	 * in case when focus is moved to the modal dialog.
	 */
	closeIfFocusOutside() {
		if (
			! this.containerRef.current.contains( document.activeElement ) &&
			! document.activeElement.closest( '[role="dialog"]' )
		) {
			this.close();
		}
	}

	close() {
		if ( this.props.onClose ) {
			this.props.onClose();
		}
		this.setState( { isOpen: false } );
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
			focusOnMount,
			popoverProps,
		} = this.props;

		const args = { isOpen, onToggle: this.toggle, onClose: this.close };

		return (
			<div className={ classnames( 'components-dropdown', className ) } ref={ this.containerRef }>
				{ renderToggle( args ) }
				{ isOpen && (
					<Popover
						className={ contentClassName }
						position={ position }
						onClose={ this.close }
						onFocusOutside={ this.closeIfFocusOutside }
						expandOnMobile={ expandOnMobile }
						headerTitle={ headerTitle }
						focusOnMount={ focusOnMount }
						{ ...popoverProps }
					>
						{ renderContent( args ) }
					</Popover>
				) }
			</div>
		);
	}
}

export default Dropdown;
