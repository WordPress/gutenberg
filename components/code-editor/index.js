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

		this.updateFocus();
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.value !== prevProps.value && this.editor.getValue() !== this.props.value ) {
			this.editor.setValue( this.props.value );
		}

		if ( this.props.focus !== prevProps.focus ) {
			this.updateFocus();
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

	updateFocus() {
		if ( this.props.focus && ! this.editor.hasFocus() ) {
			// Need to wait for the next frame to be painted before we can focus the editor
			window.requestAnimationFrame( () => {
				this.editor.focus();
			} );
		}
	}

	render() {
		return <textarea ref={ ref => this.textarea = ref } value={ this.props.value } />;
	}
}

export default CodeEditor;
