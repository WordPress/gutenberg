/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class CodeEditor extends Component {
	constructor() {
		super( ...arguments );

		this.onBlur = this.onBlur.bind( this );
	}

	componentDidMount() {
		const instance = wp.codeEditor.initialize( this.textarea );
		this.editor = instance.codemirror;

		this.editor.on( 'blur', this.onBlur );
	}

	componentWillReceiveProps( { value } ) {
		if ( this.props.value !== value && this.editor.getValue() !== value ) {
			this.editor.setValue( value );
		}
	}

	componentWillUnmount() {
		this.editor.off( 'blur', this.onBlur );

		this.editor.toTextArea();
		this.editor = null;
	}

	onBlur( editor ) {
		if ( this.props.onChange ) {
			this.props.onChange( editor.getValue() );
		}
	}

	render() {
		return <textarea ref={ ref => this.textarea = ref } value={ this.props.value } />;
	}
}

export default CodeEditor;
