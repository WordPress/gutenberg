/**
 * WordPress dependencies
 */
import { Component } from 'element';

class Inert extends Component {
	componentDidMount() {
		this.disableFields();
	}

	componentDidUpdate() {
		this.disableFields();
	}

	disableFields() {
		const focusables = this.node.querySelectorAll( 'input,select,textarea,button,object,a,area' );
		Array.prototype.forEach.call( focusables, ( node ) => {
			node.tabIndex = -1;
		} );

		const editables = this.node.querySelectorAll( '[contenteditable]' );
		Array.prototype.forEach.call( editables, ( node ) => {
			node.removeAttribute( 'contenteditable' );
		} );
	}

	render() {
		return (
			<div ref={ ( node ) => this.node = node }>
				{ this.props.children }
			</div>
		);
	}
}

export default Inert;
