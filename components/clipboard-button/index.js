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

class ClipboardButton extends Component {
	componentDidMount() {
		const { text, onCopy = noop } = this.props;
		const button = findDOMNode( this.button );
		this.clipboard = new Clipboard( button, {
			text: () => text,
		} );
		this.clipboard.on( 'success', onCopy );
	}

	componentWillUnmount() {
		this.clipboard.destroy();
		delete this.clipboard;
	}

	render() {
		const { className, children } = this.props;
		const classes = classnames( 'components-clipboard-button', className );

		return (
			<Button
				ref={ ref => this.button = ref }
				className={ classes }
			>
				{ children }
			</Button>
		);
	}
}

export default ClipboardButton;
