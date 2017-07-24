/**
 * WordPress dependencies
 */
import { Component } from 'element';

const focusable = [
	'INPUT',
	'SELECT',
	'TEXTAREA',
	'BUTTON',
	'OBJECT',
];

function isFocusable( node ) {
	if ( node.tabIndex < 0 ) {
		return false;
	} else if ( -1 !== focusable.indexOf( node.nodeName ) ) {
		return ! node.disabled;
	} else if ( 'A' === node.nodeName || 'AREA' === node.nodeName ) {
		return node.hasAttribute( 'href' );
	}

	return node.tabIndex >= 0;
}

function getNextFocusable( node, siblingDirection ) {
	let parent = node.parentNode;

	let childDirection;
	if ( 'nextSibling' === siblingDirection ) {
		childDirection = 'firstChild';
	} else {
		childDirection = 'lastChild';
	}

	do {
		while ( node[ siblingDirection ] ) {
			if ( isFocusable( node[ siblingDirection ] ) ) {
				return node[ siblingDirection ];
			}

			node = node[ siblingDirection ];
		}

		node = parent[ siblingDirection ];
		if ( node ) {
			while ( node[ childDirection ] ) {
				node = node[ childDirection ];
			}
		} else {
			node = parent;
		}

		if ( isFocusable( node ) ) {
			return node;
		}

		parent = node.parentNode;
	} while ( parent );
}

class Inert extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyPress = this.onKeyPress.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyPress );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyPress );
	}

	onKeyPress( event ) {
		if ( event.which !== 9 ) {
			return;
		}

		const testDirection = event.shiftKey ? 'nextSibling' : 'previousSibling';
		if ( event.target !== getNextFocusable( this.node, testDirection ) ) {
			return;
		}

		const nextDirection = event.shiftKey ? 'previousSibling' : 'nextSibling';
		const nextFocusable = getNextFocusable( this.node, nextDirection );
		if ( nextFocusable ) {
			nextFocusable.focus();
			event.preventDefault();
		}
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
