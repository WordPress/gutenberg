let editorInstance = 1;

export default class Editable extends wp.element.Component {
	constructor( ...args ) {
		super( ...args );
		this.onInit = this.onInit.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onFocusIn = this.onFocusIn.bind( this );
		this.onFocusOut = this.onFocusOut.bind( this );
		this.id = `tinymce-instance-${ editorInstance }`;
		editorInstance++;
	}

	componentDidMount() {
		this.initialize();
		if ( this.props.focusConfig ) {
			this.focus();
		}
	}

	initialize() {
		const config = {
			mode: 'exact',
			elements: this.id,
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
		const value = this.editor.getContent();
		if ( value === this.props.value ) {
			return;
		}

		this.props.onChange( value );
	}

	onFocusIn() {
		this.isFocused = true;
	}

	onFocusOut() {
		this.isFocused = false;
		this.onChange();
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
			this.updateContent( !! prevProps.focusConfig );
		}
	}

	render() {
		return <div id={ this.id } contentEditable />;
	}
}
