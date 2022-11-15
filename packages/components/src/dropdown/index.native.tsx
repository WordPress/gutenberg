/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DropdownProps } from './types';

type DropdownState = {
	isOpen: boolean;
};

class Dropdown extends Component< DropdownProps, DropdownState > {
	constructor( args: DropdownProps ) {
		super( args );

		this.toggle = this.toggle.bind( this );
		this.close = this.close.bind( this );

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

	componentDidUpdate( _prevProps: DropdownProps, prevState: DropdownState ) {
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

	close() {
		this.setState( { isOpen: false } );
	}

	render() {
		const { isOpen } = this.state;
		const { renderContent, renderToggle } = this.props;

		const args = { isOpen, onToggle: this.toggle, onClose: this.close };

		return (
			<>
				{ renderToggle( args ) }
				{ isOpen && renderContent( args ) }
			</>
		);
	}
}

export default Dropdown;
