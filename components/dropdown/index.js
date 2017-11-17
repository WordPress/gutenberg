/**
 * WordPress Dependeencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import withFocusReturn from '../higher-order/with-focus-return';
import Popover from '../popover';

const FocusManaged = withFocusReturn( ( { children } ) => children );

class Dropdown extends Component {
	constructor() {
		super( ...arguments );
		this.toggle = this.toggle.bind( this );
		this.close = this.close.bind( this );
		this.clickOutside = this.clickOutside.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
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

	componentWillUpdate( nextProps, nextState ) {
		const { isOpen } = nextState;
		const { onToggle } = nextProps;
		if ( this.state.isOpen !== isOpen && onToggle ) {
			onToggle( isOpen );
		}
	}

	bindContainer( ref ) {
		this.container = ref;
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
		const { renderContent, renderToggle, position = 'bottom', className, contentClassName } = this.props;
		const args = { isOpen, onToggle: this.toggle, onClose: this.close };
		return (
			<div className={ className } ref={ this.bindContainer }>
				{ renderToggle( args ) }
				<Popover
					className={ contentClassName }
					isOpen={ isOpen }
					position={ position }
					onClose={ this.close }
					onClickOutside={ this.clickOutside }
				>
					<FocusManaged>
						{ renderContent( args ) }
					</FocusManaged>
				</Popover>
			</div>
		);
	}
}

export default Dropdown;
