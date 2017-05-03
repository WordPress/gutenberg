export default class TinyMCE extends wp.element.Component {
	componentDidMount() {
		tinymce.init( {
			target: this.editorNode,
			theme: false,
			inline: true,
			toolbar: false,
			browser_spellcheck: true,
			entity_encoding: 'raw',
			convert_urls: false,
			setup: this.props.onSetup,
			formats: {
				strikethrough: { inline: 'del' }
			}
		} );

		if ( this.props.focus ) {
			this.editorNode.focus();
		}
	}

	shouldComponentUpdate() {
		// We must prevent rerenders because TinyMCE will modify the DOM, thus
		// breaking React's ability to reconcile changes.
		//
		// See: https://github.com/facebook/react/issues/6802
		return false;
	}

	render() {
		const { tagName = 'div', style, className, defaultValue } = this.props;

		// If a default value is provided, render it into the DOM even before
		// TinyMCE finishes initializing. This avoids a short delay by allowing
		// us to show and focus the content before it's truly ready to edit.
		let children;
		if ( defaultValue ) {
			children = wp.element.Children.toArray( defaultValue );
		}

		return wp.element.createElement( tagName, {
			ref: ( node ) => this.editorNode = node,
			contentEditable: true,
			suppressContentEditableWarning: true,
			style,
			className
		}, children );
	}
}
