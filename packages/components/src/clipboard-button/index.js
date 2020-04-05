/**
 * External dependencies
 */
import Clipboard from 'clipboard';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';

class ClipboardButton extends Component {
	constructor() {
		super( ...arguments );

		this.containerRef = createRef();
		this.onCopy = this.onCopy.bind( this );
		this.getText = this.getText.bind( this );
	}

	componentDidMount() {
		const { getText, onCopy } = this;
		const container = this.containerRef.current;

		this.clipboard = new Clipboard( container.firstChild, {
			text: getText,
			container,
		} );

		this.clipboard.on( 'success', onCopy );
	}

	componentWillUnmount() {
		this.clipboard.destroy();
		delete this.clipboard;
		clearTimeout( this.onCopyTimeout );
	}

	onCopy( args ) {
		// Clearing selection will move focus back to the triggering button,
		// ensuring that it is not reset to the body, and further that it is
		// kept within the rendered node.
		args.clearSelection();

		const { onCopy, onFinishCopy } = this.props;
		if ( onCopy ) {
			onCopy();
			// For convenience and consistency, ClipboardButton offers to call
			// a secondary callback with delay. This is useful to reset
			// consumers' state, e.g. to revert a label from "Copied" to
			// "Copy".
			if ( onFinishCopy ) {
				clearTimeout( this.onCopyTimeout );
				this.onCopyTimeout = setTimeout( onFinishCopy, 4000 );
			}
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
		const {
			className,
			children,
			// Disable reason: Exclude from spread props passed to Button
			// eslint-disable-next-line no-unused-vars
			onCopy,
			// eslint-disable-next-line no-unused-vars
			onFinishCopy,
			// eslint-disable-next-line no-unused-vars
			text,
			...buttonProps
		} = this.props;
		const classes = classnames( 'components-clipboard-button', className );

		// Workaround for inconsistent behavior in Safari, where <textarea> is not
		// the document.activeElement at the moment when the copy event fires.
		// This causes documentHasSelection() in the copy-handler component to
		// mistakenly override the ClipboardButton, and copy a serialized string
		// of the current block instead.
		const focusOnCopyEventTarget = ( event ) => {
			event.target.focus();
		};

		return (
			<span ref={ this.containerRef } onCopy={ focusOnCopyEventTarget }>
				<Button { ...buttonProps } className={ classes }>
					{ children }
				</Button>
			</span>
		);
	}
}

export default ClipboardButton;
