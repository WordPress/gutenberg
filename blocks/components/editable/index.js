export default class Editable extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.onInit = this.onInit.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onFocusIn = this.onFocusIn.bind( this );
		this.onFocusOut = this.onFocusOut.bind( this );
		this.bindNode = this.bindNode.bind( this );
	}

	componentDidMount() {
		this.initialize();
	}

	initialize() {
		const config = {
			target: this.node,
			theme: false,
			inline: true,
			toolbar: false,
			entity_encoding: 'raw',
			setup: this.onSetup,
			formats: {
				strikethrough: { inline: 'del' }
			}
		};

		tinymce.init( config );
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusIn', this.onFocusIn );
		editor.on( 'focusout', this.onFocusOut );
	}

	onInit() {
		this.editor.setContent( this.props.value );
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}
		const value = this.editor.getContent();
		this.editor.save();
		this.props.onChange( value );
	}

	onFocusIn() {
		this.isFocused = true;
	}

	onFocusOut() {
		this.isFocused = false;
		this.onChange();
	}

	bindNode( ref ) {
		this.node = ref;
	}

	updateContent() {
		let bookmark;
		if ( this.isFocused ) {
			bookmark = this.editor.selection.getBookmark( 2, true );
		}
		this.editor.setContent( this.props.value );
		if ( this.isFocused ) {
			this.editor.selection.moveToBookmark( bookmark );
		}
	}

	componentWillUnmount() {
		if ( this.editor ) {
			this.editor.destroy();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.value !== prevProps.value ) {
			this.updateContent();
		}
	}

	render() {
		return <div ref={ this.bindNode } />;
	}
}
