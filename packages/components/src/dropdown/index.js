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
		this.clickOutside = this.clickOutside.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
		this.refresh = this.refresh.bind( this );
		this.popoverRef = createRef();
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

	bindContainer( ref ) {
		this.container = ref;
	}

	/**
	 * When contents change height due to user interaction,
	 * `refresh` can be called to re-render Popover with correct
	 * attributes which allow scroll, if need be.
	 */
	refresh() {
		if ( this.popoverRef.current ) {
			this.popoverRef.current.refresh();
		}
	}

	toggle() {
		this.setState( ( state ) => ( {
			isOpen: ! state.isOpen,
		} ) );
	}

	clickOutside( event ) {
		if ( ! this.container.contains( event.target ) ) {
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
			<div className={ className } ref={ this.bindContainer }>
				{ renderToggle( args ) }
				{ isOpen && (
					<Popover
						className={ contentClassName }
						ref={ this.popoverRef }
						position={ position }
						onClose={ this.close }
						onClickOutside={ this.clickOutside }
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
