/**
 * External dependencies
 */
import { nodeListToReact } from 'dom-react';
import { isEqual, omitBy } from 'lodash';

/**
 * Internal dependencies
 */
import TinyMCE from '../../editable/tinymce';
import BlockControls from '../../block-controls';

const FREEFORM_CONTROLS = [
	{
		id: 'blockquote',
		icon: 'editor-quote',
		title: wp.i18n.__( 'Quote' ),
	},
	{
		id: 'bullist',
		icon: 'editor-ul',
		title: wp.i18n.__( 'Convert to unordered' ),
	},
	{
		id: 'numlist',
		icon: 'editor-ol',
		title: wp.i18n.__( 'Convert to ordered' ),
	},
	{
		id: 'bold',
		icon: 'editor-bold',
		title: wp.i18n.__( 'Bold' ),
	},
	{
		id: 'italic',
		icon: 'editor-italic',
		title: wp.i18n.__( 'Italic' ),
	},
	{
		id: 'strikethrough',
		icon: 'editor-strikethrough',
		title: wp.i18n.__( 'Strikethrough' ),
	},
];

const ALIGNMENT_CONTROLS = [
	{
		id: 'alignleft',
		icon: 'editor-alignleft',
		title: wp.i18n.__( 'Align left' ),
	},
	{
		id: 'aligncenter',
		icon: 'editor-aligncenter',
		title: wp.i18n.__( 'Align center' ),
	},
	{
		id: 'alignright',
		icon: 'editor-alignright',
		title: wp.i18n.__( 'Align right' ),
	},
];

function createElement( type, props, ...children ) {
	if ( props[ 'data-mce-bogus' ] === 'all' ) {
		return null;
	}

	if ( props.hasOwnProperty( 'data-mce-bogus' ) ) {
		return children;
	}

	return wp.element.createElement(
		type,
		omitBy( props, ( value, key ) => key.indexOf( 'data-mce-' ) === 0 ),
		...children
	);
}

export default class FreeformBlock extends wp.element.Component {
	constructor( props ) {
		super( ...arguments );
		this.getSettings = this.getSettings.bind( this );
		this.setButtonActive = this.setButtonActive.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onInit = this.onInit.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.updateFocus = this.updateFocus.bind( this );
		this.updateContent = this.updateContent.bind( this );
		this.setContent = this.setContent.bind( this );
		this.getContent = this.getContent.bind( this );
		this.controls = this.mapControls.bind( this );
		this.editor = null;
		this.savedContent = null;
		this.state = {
			empty: ! props.value || ! props.value.length,
			activeButtons: { },
		};
	}

	getSettings( baseSettings ) {
		return {
			...baseSettings,
			plugins: ( baseSettings.plugins || [] ).concat( 'lists' ),
		};
	}

	setButtonActive( id, active ) {
		const activeButtons = {
			...this.state.activeButtons,
			[ id ]: active,
		};
		this.setState( { activeButtons } );
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
		editor.on( 'focusin', this.onFocus );
	}

	onInit() {
		FREEFORM_CONTROLS.forEach( ( control ) => {
			if ( control.id ) {
				const button = this.editor.buttons[ control.id ];
				button.onPostRender.call( {
					active: ( isActive ) => this.setButtonActive( control.id, isActive ),
				}, this.editor );
			}
		} );
		this.updateFocus();
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}

		this.savedContent = this.getContent();
		this.editor.save();
		this.props.onChange( this.savedContent );
	}

	onFocus() {
		if ( this.props.onFocus ) {
			this.props.onFocus();
		}
	}

	updateFocus() {
		const { focus } = this.props;
		if ( focus ) {
			this.editor.focus();
			// Offset = -1 means we should focus the end of the editable
			if ( focus.offset === -1 ) {
				this.editor.selection.select( this.editor.getBody(), true );
				this.editor.selection.collapse( false );
			}
		} else {
			this.editor.getBody().blur();
		}
	}

	updateContent() {
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.savedContent = this.props.value;
		this.setContent( this.savedContent );
		this.editor.selection.moveToBookmark( bookmark );

		// Saving the editor on updates avoid unecessary onChanges calls
		// These calls can make the focus jump
		this.editor.save();
	}

	setContent( content ) {
		if ( ! content ) {
			content = '';
		}

		content = wp.element.renderToString( content );
		this.editor.setContent( content, { format: 'raw' } );
	}

	getContent() {
		return nodeListToReact( this.editor.getBody().childNodes || [], createElement );
	}

	mapControls( controls ) {
		return controls.map( ( control ) => ( {
			...control,
			onClick: () => this.editor && this.editor.buttons[ control.id ].onclick(),
			isActive: this.state.activeButtons[ control.id ],
		} ) );
	}

	componentWillUnmount() {
		this.onChange();
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.focus !== prevProps.focus ) {
			this.updateFocus();
		}

		// The `savedContent` var allows us to avoid updating the content right after an `onChange` call
		if (
			this.props.content !== prevProps.content &&
			this.props.content !== this.savedContent &&
			! isEqual( this.props.content, prevProps.content ) &&
			! isEqual( this.props.content, this.savedContent )
		) {
			this.updateContent();
		}
	}

	render() {
		const { content, focus } = this.props;

		return [
			focus && (
				<BlockControls
					key="aligns"
					controls={ this.mapControls( ALIGNMENT_CONTROLS ) }
				/>
			),
			focus && (
				<BlockControls
					key="controls"
					controls={ this.mapControls( FREEFORM_CONTROLS ) }
				/>
			),
			<TinyMCE
				key="editor"
				getSettings={ this.getSettings }
				onSetup={ this.onSetup }
				defaultValue={ content }
				isEmpty={ this.state.empty }
				/>,
		];
	}
}
