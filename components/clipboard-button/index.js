/**
 * External dependencies
 */
import Clipboard from 'clipboard';
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { findDOMNode, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../';

// This creates a container to put the textarea in which isn't removed by react
// If react removes the textarea first, then the clipboard fails when trying to remove it
class ClipboardContainer extends Component {
	componentDidMount() {
		const { text, buttonNode, onCopy = noop } = this.props;
		this.clipboard = new Clipboard( buttonNode, {
			text: () => text,
			// If we put the textarea in a specific container, then the focus stays
			// within this container (for use in whenFocusOutside)
			container: this.container,
		} );
		this.clipboard.on( 'success', onCopy );
	}

	componentWillUnmount() {
		this.clipboard.destroy();
		delete this.clipboard;
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		return <div ref={ ref => this.container = ref } />;
	}
}

class ClipboardButton extends Component {
	constructor() {
		super( ...arguments );
		this.bindButton = this.bindButton.bind( this );
	}

	bindButton( ref ) {
		if ( ref ) {
			this.button = ref;
			// Need to pass the button node down to use as the trigger
			// The first rendering of ClipboardContainer it's null
			this.forceUpdate();
		}
	}
	render() {
		const { className, children, onCopy, text } = this.props;
		const classes = classnames( 'components-clipboard-button', className );

		return (
			<Button
				ref={ this.bindButton }
				className={ classes }
			>
				{ children }
				{ this.button && <ClipboardContainer buttonNode={ findDOMNode( this.button ) } onCopy={ onCopy }  		text={ text } /> }
			</Button>
		);
	}
}

export default ClipboardButton;
