/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

export default class Editable extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.onInit = this.onInit.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
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
			browser_spellcheck: true,
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
		editor.on( 'focusout', this.onChange );
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

	bindNode( ref ) {
		this.node = ref;
	}

	updateContent() {
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.editor.setContent( this.props.value );
		this.editor.selection.moveToBookmark( bookmark );
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
		const { tagName: Tag = 'div', style, className } = this.props;
		const classes = classnames( 'blocks-editable', className );

		return (
			<Tag
				ref={ this.bindNode }
				style={ style }
				className={ classes } />
		);
	}
}
