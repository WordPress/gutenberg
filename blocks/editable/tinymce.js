/**
 * External dependencies
 */
import tinymce from 'tinymce';

/**
 * WordPress dependencies
 */
import { Component, Children, createElement } from '@wordpress/element';

export default class TinyMCE extends Component {
	componentDidMount() {
		this.initialize();
	}

	componentWillUnmount() {
		if ( this.observer ) {
			this.observer.disconnect();
		}

		if ( this.editor ) {
			this.editor.destroy();
			delete this.editor;
		}
	}

	shouldComponentUpdate() {
		// We must prevent rerenders because TinyMCE will modify the DOM, thus
		// breaking React's ability to reconcile changes.
		//
		// See: https://github.com/facebook/react/issues/6802
		return false;
	}

	mirrorNode( node ) {
		// Since React reconciliation is disabled for the TinyMCE node, we sync
		// attribute changes using a mutation observer on a node within the
		// parent Editable which receives reconciliation from Editable props.
		this.observer = new window.MutationObserver( ( mutations ) => {
			mutations.forEach( ( mutation ) => {
				const { attributeName } = mutation;
				const nextValue = node.getAttribute( attributeName );

				if ( null === nextValue ) {
					this.editorNode.removeAttribute( attributeName );
				} else {
					this.editorNode.setAttribute( attributeName, nextValue );
				}
			} );
		} );

		this.observer.observe( node, {
			attributes: true,
		} );
	}

	initialize() {
		const { focus } = this.props;

		const settings = this.props.getSettings( {
			theme: false,
			inline: true,
			toolbar: false,
			browser_spellcheck: true,
			entity_encoding: 'raw',
			convert_urls: false,
			plugins: [],
			formats: {
				strikethrough: { inline: 'del' },
			},
		} );

		settings.plugins.push( 'paste' );

		tinymce.init( {
			...settings,
			target: this.editorNode,
			setup: ( editor ) => {
				this.editor = editor;
				this.props.onSetup( editor );
			},
		} );

		if ( focus ) {
			this.editorNode.focus();
		}
	}

	render() {
		const { tagName = 'div', defaultValue, additionalProps } = this.props;

		// If a default value is provided, render it into the DOM even before
		// TinyMCE finishes initializing. This avoids a short delay by allowing
		// us to show and focus the content before it's truly ready to edit.
		let children;
		if ( defaultValue ) {
			children = Children.toArray( defaultValue );
		}

		return createElement( tagName, {
			ref: ( node ) => this.editorNode = node,
			contentEditable: true,
			suppressContentEditableWarning: true,
			...additionalProps,
		}, children );
	}
}
