export default class TinyMCE extends wp.element.Component {
	componentDidMount() {
		this.initialize();
	}

	shouldComponentUpdate( nextProps ) {
		// We must prevent rerenders because TinyMCE will modify the DOM, thus
		// breaking React's ability to reconcile changes.
		//
		// See: https://github.com/facebook/react/issues/6802
		return nextProps.tagName !== this.props.tagName;
	}

	componentWillUpdate( nextProps ) {
		if ( ! this.editor ) {
			return;
		}

		if ( nextProps.tagName !== this.props.tagName ) {
			this.editor.destroy();
			this.editor = null;
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.tagName !== prevProps.tagName ) {
			this.initialize();
		}
	}

	componentWillUnmount() {
		if ( ! this.editor ) {
			return;
		}

		this.editor.destroy();
		this.editor = null;
	}

	initialize() {
		tinymce.init( {
			target: this.editorNode,
			theme: false,
			inline: true,
			toolbar: false,
			browser_spellcheck: true,
			entity_encoding: 'raw',
			convert_urls: false,
			setup: ( editor ) => {
				this.editor = editor;
				this.props.onSetup( editor );
			},
			formats: {
				strikethrough: { inline: 'del' }
			}
		} );

		if ( this.props.focus ) {
			this.editorNode.focus();
		}
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
