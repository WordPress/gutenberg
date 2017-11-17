/**
 * External dependencies
 */
import Clipboard from 'clipboard';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../';

class ClipboardButton extends Component {
	constructor() {
		super( ...arguments );

		this.bindContainer = this.bindContainer.bind( this );
		this.onCopy = this.onCopy.bind( this );
		this.getText = this.getText.bind( this );
	}

	componentDidMount() {
		const { container, getText, onCopy } = this;
		const button = container.firstChild;

		this.clipboard = new Clipboard( button,	{
			text: getText,
			container,
		} );

		this.clipboard.on( 'success', onCopy );
	}

	componentWillUnmount() {
		this.clipboard.destroy();
		delete this.clipboard;
	}

	bindContainer( container ) {
		this.container = container;
	}

	onCopy( args ) {
		// Clearing selection will move focus back to the triggering button,
		// ensuring that it is not reset to the body, and further that it is
		// kept within the rendered node.
		args.clearSelection();

		const { onCopy } = this.props;
		if ( onCopy ) {
			onCopy();
		}
	}

	getText() {
		let text = this.props.text;
		if ( 'function' === typeof text ) {
			text = text();
		}

		return text;
	}

	render() {
		// Disable reason: Exclude from spread props passed to Button
		// eslint-disable-next-line no-unused-vars
		const { className, children, onCopy, text, ...buttonProps } = this.props;
		const classes = classnames( 'components-clipboard-button', className );

		return (
			<span ref={ this.bindContainer }>
				<Button { ...buttonProps } className={ classes }>
					{ children }
				</Button>
			</span>
		);
	}
}

export default ClipboardButton;
