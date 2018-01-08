/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class CodeEditor extends Component {
	constructor() {
		super( ...arguments );

		this.onBlur = this.onBlur.bind( this );
		this.onKeyHandled = this.onKeyHandled.bind( this );
	}

	componentDidMount() {
		const instance = wp.codeEditor.initialize( this.textarea );
		this.editor = instance.codemirror;

		this.editor.on( 'blur', this.onBlur );
		this.editor.on( 'keyHandled', this.onKeyHandled );
	}

	componentWillReceiveProps( { value } ) {
		if ( this.props.value !== value && this.editor.getValue() !== value ) {
			this.editor.setValue( value );
		}
	}

	componentWillUnmount() {
		this.editor.off( 'blur', this.onBlur );
		this.editor.off( 'keyHandled', this.onKeyHandled );

		this.editor.toTextArea();
		this.editor = null;
	}

	onBlur( editor ) {
		if ( this.props.onChange ) {
			this.props.onChange( editor.getValue() );
		}
	}

	onKeyHandled( editor, name, event ) {
		// Stop events from propagating out of the component. This makes the editor
		// behave like a textarea, e.g. pressing CMD+UP moves the cursor to the top of
		// the editor, rather than to a different element.
		event.stopImmediatePropagation();
	}

	render() {
		return <textarea ref={ ref => this.textarea = ref } value={ this.props.value } />;
	}
}

export default CodeEditor;
