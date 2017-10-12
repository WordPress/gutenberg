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

class ClipboardContainer extends Component {
	componentDidMount() {
		const { text, buttonNode, onCopy = noop } = this.props;
		this.clipboard = new Clipboard( buttonNode, {
			text: () => text,
			container: this.container,
		} );
		this.clipboard.on( 'success', onCopy );
	}

	componentWillUnmount() {
		this.clipboard.destroy();
		delete this.clipboard;
	}

	componentShouldUpate() {
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
