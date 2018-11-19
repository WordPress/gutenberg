/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
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
		this.closeIfClickOutside = this.closeIfClickOutside.bind( this );
		this.refresh = this.refresh.bind( this );

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

	/**
	 * When contents change height due to user interaction,
	 * `refresh` can be called to re-render Popover with correct
	 * attributes which allow scroll, if need be.
	 * @deprecated
	 */
	refresh() {
		deprecated( 'Dropdown.refresh()', {
			plugin: 'Gutenberg',
			version: '4.5',
			hint: 'Popover is now automatically re-rendered without needing to execute "refresh"',
		} );
	}

	toggle() {
		this.setState( ( state ) => ( {
			isOpen: ! state.isOpen,
		} ) );
	}

	/**
	 * Closes the dropdown if a click occurs outside the dropdown wrapper. This
	 * is intentionally distinct from `onClose` in that a click outside the
	 * popover may occur in the toggling of the dropdown via its toggle button.
	 * The correct behavior is to keep the dropdown closed.
	 *
	 * @param {MouseEvent} event Click event triggering `onClickOutside`.
	 */
	closeIfClickOutside( event ) {
		if ( ! this.containerRef.current.contains( event.target ) ) {
			this.close();
		}
	}

	close() {
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
		} = this.props;

		const args = { isOpen, onToggle: this.toggle, onClose: this.close };

		return (
			<div className={ className } ref={ this.containerRef }>
				{ renderToggle( args ) }
				{ isOpen && (
					<Popover
						className={ contentClassName }
						position={ position }
						onClose={ this.close }
						onClickOutside={ this.closeIfClickOutside }
						expandOnMobile={ expandOnMobile }
						headerTitle={ headerTitle }
					>
						{ renderContent( args ) }
					</Popover>
				) }
			</div>
		);
	}
}

export default Dropdown;
