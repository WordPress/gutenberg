/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEqual, capitalize, omitBy, forEach, merge, compact, drop, keyBy } from 'lodash';
import { nodeListToReact } from 'dom-react';
import { Fill } from 'react-slot-fill';
import 'element-closest';

/**
 * WordPress dependencies
 */
import Toolbar from 'components/toolbar';

/**
 * Internal dependencies
 */
import './style.scss';
import FormatToolbar from './format-toolbar';
import TinyMCE from './tinymce';
import { toState, isEmpty, atStart, atEnd, getFormats } from './state';

const KEYCODE_BACKSPACE = 8;
const KEYCODE_DELETE = 46;

const alignmentMap = {
	alignleft: 'left',
	alignright: 'right',
	aligncenter: 'center',
};

const ALIGNMENT_CONTROLS = [
	{
		icon: 'editor-alignleft',
		title: wp.i18n.__( 'Align left' ),
		align: 'left',
	},
	{
		icon: 'editor-aligncenter',
		title: wp.i18n.__( 'Align center' ),
		align: 'center',
	},
	{
		icon: 'editor-alignright',
		title: wp.i18n.__( 'Align right' ),
		align: 'right',
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

export default class Editable extends wp.element.Component {
	constructor( props ) {
		super( ...arguments );

		this.onInit = this.onInit.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNewBlock = this.onNewBlock.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.changeFormats = this.changeFormats.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );

		const empty = {
			formats: {},
			text: '',
		};

		this.state = {
			alignment: null,
			bookmark: null,
			selection: {},
			value: props.inline ? empty : [ empty ],
		};
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'selectionChange', this.onSelectionChange );
	}

	syncState() {
		this.setState( toState(
			this.editor.getBody(),
			this.editor.selection.getRng(),
			{ inline: this.props.inline }
		) );
	}

	onInit() {
		this.updateFocus();
		this.syncState();
	}

	onFocus() {
		if ( ! this.props.onFocus ) {
			return;
		}

		// TODO: We need a way to save the focus position ( bookmark maybe )
		this.props.onFocus();
	}

	isActive() {
		return document.activeElement === this.editor.getBody();
	}

	onSelectionChange() {
		// We must check this because selectionChange is a global event.
		if ( ! this.isActive() ) {
			return;
		}

		this.syncState();
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}

		this.savedContent = this.getContent();
		this.editor.save();
		this.props.onChange( this.savedContent );
	}

	getRelativePosition( node ) {
		const position = node.getBoundingClientRect();

		// Find the parent "relative" positioned container
		const container = this.props.inlineToolbar
			? this.editor.getBody().closest( '.blocks-editable' )
			: this.editor.getBody().closest( '.editor-visual-editor__block' );
		const containerPosition = container.getBoundingClientRect();
		const blockPadding = 14;
		const blockMoverMargin = 18;

		// These offsets are necessary because the toolbar where the link modal lives
		// is absolute positioned and it's not shown when we compute the position here
		// so we compute the position about its parent relative position and adds the offset
		const toolbarOffset = this.props.inlineToolbar
			? { top: 50, left: 0 }
			: { top: 40, left: -( ( blockPadding * 2 ) + blockMoverMargin ) };
		const linkModalWidth = 250;

		return {
			top: position.top - containerPosition.top + ( position.height ) + toolbarOffset.top,
			left: position.left - containerPosition.left - ( linkModalWidth / 2 ) + ( position.width / 2 ) + toolbarOffset.left,
		};
	}

	onKeyDown( event ) {
		if (
			this.props.onMerge && (
				( event.keyCode === KEYCODE_BACKSPACE && atStart( this.state ) ) ||
				( event.keyCode === KEYCODE_DELETE && atEnd( this.state ) )
			)
		) {
			const forward = event.keyCode === KEYCODE_DELETE;
			this.onChange();
			this.props.onMerge( forward );
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	}

	onNewBlock() {
		const { inline, onSplit } = this.props;
		const { selection, value } = this.state;

		if ( inline || ! onSplit ) {
			return;
		}

		if ( ! selection.start ) {
			return;
		}

		if ( value.length < 2 ) {
			return;
		}

		if ( ! isEqual( selection.start, selection.end ) || ! selection.start.length ) {
			return;
		}

		const [ index ] = selection.start;

		if ( compact( drop( selection.start ) ).length ) {
			return;
		}

		const content = this.getContent();

		this.setContent( content.slice( 0, index ) );

		onSplit( content.slice( 0, index ), content.slice( index + 1 ) );
	}

	onNodeChange( { element } ) {
		const alignments = this.editor.formatter.matchAll( [ 'alignleft', 'aligncenter', 'alignright' ] );
		const alignment = alignments.length > 0 ? alignmentMap[ alignments[ 0 ] ] : null;

		const focusPosition = this.getRelativePosition( element );
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.setState( { alignment, bookmark, focusPosition } );
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

	componentWillUnmount() {
		this.onChange();
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.focus !== prevProps.focus ) {
			this.updateFocus();
		}

		// The savedContent var allows us to avoid updating the content right after an onChange call
		if (
			this.props.tagName === prevProps.tagName &&
			this.props.value !== prevProps.value &&
			this.props.value !== this.savedContent &&
			! isEqual( this.props.value, prevProps.value ) &&
			! isEqual( this.props.value, this.savedContent )
		) {
			this.updateContent();
		}
	}

	isFormatActive( format ) {
		return !! this.getFormats()[ format ];
	}

	changeFormats( formats ) {
		if ( this.state.bookmark ) {
			this.editor.selection.moveToBookmark( this.state.bookmark );
		}

		forEach( formats, ( formatValue, format ) => {
			if ( format === 'link' ) {
				if ( formatValue !== undefined ) {
					const anchor = this.editor.dom.getParent( this.editor.selection.getNode(), 'a' );
					if ( ! anchor ) {
						this.editor.formatter.remove( 'link' );
					}
					this.editor.formatter.apply( 'link', { href: formatValue.href }, anchor );
				} else {
					this.editor.execCommand( 'Unlink' );
				}
			} else {
				const isActive = this.isFormatActive( format );
				if ( isActive && ! formatValue ) {
					this.editor.formatter.remove( format );
				} else if ( ! isActive && formatValue ) {
					this.editor.formatter.apply( format );
				}
			}
		} );

		this.setState( {
			formats: merge( {}, this.state.formats, formats ),
		} );

		this.editor.setDirty( true );
	}

	isAlignmentActive( align ) {
		return this.state.alignment === align;
	}

	toggleAlignment( align ) {
		this.editor.focus();

		if ( this.isAlignmentActive( align ) ) {
			this.editor.execCommand( 'JustifyNone' );
		} else {
			this.editor.execCommand( 'Justify' + capitalize( align ) );
		}
	}

	getFormats() {
		const formatMap = {
			em: 'italic',
			strong: 'bold',
			del: 'strikethrough',
			a: 'link',
		};

		return keyBy( getFormats( this.state ), ( format ) => formatMap[ format.type ] );
	}

	render() {
		const {
			tagName,
			style,
			value,
			focus,
			className,
			showAlignments = false,
			inlineToolbar = false,
			inline,
			formattingControls,
			placeholder,
		} = this.props;

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount (+ destroy) the previous TinyMCE element, then
		// mount (+ initialize) a new child element in its place.
		const key = [ 'editor', tagName ].join();
		const classes = classnames( className, 'blocks-editable' );

		const formatToolbar = (
			<FormatToolbar
				focusPosition={ this.state.focusPosition }
				formats={ this.getFormats() }
				onChange={ this.changeFormats }
				enabledControls={ formattingControls }
			/>
		);

		return (
			<div className={ classes }>
				{ focus &&
					<Fill name="Formatting.Toolbar">
						{ showAlignments &&
							<Toolbar
								controls={ ALIGNMENT_CONTROLS.map( ( control ) => ( {
									...control,
									onClick: () => this.toggleAlignment( control.align ),
									isActive: this.isAlignmentActive( control.align ),
								} ) ) } />
						}
						{ ! inlineToolbar && formatToolbar }
					</Fill>
				}

				{ focus && inlineToolbar &&
					<div className="block-editable__inline-toolbar">
						{ formatToolbar }
					</div>
				}

				<TinyMCE
					tagName={ tagName }
					onSetup={ this.onSetup }
					style={ style }
					defaultValue={ value }
					settings={ {
						forced_root_block: inline ? false : 'p',
					} }
					isEmpty={ isEmpty( this.state ) }
					placeholder={ placeholder }
					key={ key } />
			</div>
		);
	}
}
