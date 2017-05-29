/**
 * External dependencies
 */
import classnames from 'classnames';
import { last, isEqual, capitalize, omitBy, identity } from 'lodash';
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
import TinyMCE from './tinymce';
import FormatToolbar from './format-toolbar';

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
		this.getSettings = this.getSettings.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNewBlock = this.onNewBlock.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );

		this.state = {
			alignment: null,
			empty: ! props.value || ! props.value.length,
		};
	}

	getSettings( settings ) {
		return ( this.props.getSettings || identity )( {
			...settings,
			forced_root_block: this.props.inline ? false : 'p',
		} );
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'keyup', this.onKeyUp );
		editor.on( 'selectionChange', this.onSelectionChange );

		if ( this.props.onSetup ) {
			this.props.onSetup( editor );
		}
	}

	onInit() {
		this.updateFocus();
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

		const content = this.getContent();
		const collapsed = this.editor.selection.isCollapsed();
		const previousCollpsedValue = this.props.focus.collapsed !== undefined ? this.props.focus.collapsed : true;

		this.setState( {
			empty: ! content || ! content.length,
		} );

		if ( collapsed !== previousCollpsedValue ) {
			this.props.onFocus( {
				...this.props.focus,
				collapsed,
			} );
		}
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}

		this.savedContent = this.getContent();
		this.editor.save();
		this.props.onChange( this.savedContent );
	}

	isStartOfEditor() {
		const range = this.editor.selection.getRng();
		if ( range.startOffset !== 0 || ! range.collapsed ) {
			return false;
		}
		const start = range.startContainer;
		const body = this.editor.getBody();
		let element = start;
		while ( element !== body ) {
			const child = element;
			element = element.parentNode;
			if ( element.firstChild !== child ) {
				return false;
			}
		}
		return true;
	}

	isEndOfEditor() {
		const range = this.editor.selection.getRng();
		if ( range.endOffset !== range.endContainer.textContent.length || ! range.collapsed ) {
			return false;
		}
		const start = range.endContainer;
		const body = this.editor.getBody();
		let element = start;
		while ( element !== body ) {
			const child = element;
			element = element.parentNode;
			if ( element.lastChild !== child ) {
				return false;
			}
		}
		return true;
	}

	onKeyDown( event ) {
		if (
			this.props.onMerge && (
				( event.keyCode === KEYCODE_BACKSPACE && this.isStartOfEditor() ) ||
				( event.keyCode === KEYCODE_DELETE && this.isEndOfEditor() )
			)
		) {
			const forward = event.keyCode === KEYCODE_DELETE;
			this.onChange();
			this.props.onMerge( forward );
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	}

	onKeyUp( { keyCode } ) {
		if ( keyCode === KEYCODE_BACKSPACE ) {
			this.onSelectionChange();
		}
	}

	onNewBlock() {
		if ( this.props.tagName || ! this.props.onSplit ) {
			return;
		}

		// Getting the content before and after the cursor
		const childNodes = Array.from( this.editor.getBody().childNodes );
		let selectedChild = this.editor.selection.getStart();
		while ( childNodes.indexOf( selectedChild ) === -1 && selectedChild.parentNode ) {
			selectedChild = selectedChild.parentNode;
		}
		const splitIndex = childNodes.indexOf( selectedChild );
		if ( splitIndex === -1 ) {
			return;
		}
		const beforeNodes = childNodes.slice( 0, splitIndex );
		const lastNodeBeforeCursor = last( beforeNodes );
		// Avoid splitting on single enter
		if (
			! lastNodeBeforeCursor ||
			beforeNodes.length < 2 ||
			!! lastNodeBeforeCursor.textContent
		) {
			return;
		}

		const before = beforeNodes.slice( 0, beforeNodes.length - 1 );

		// Removing empty nodes from the beginning of the "after"
		// avoids empty paragraphs at the beginning of newly created blocks.
		const after = childNodes.slice( splitIndex ).reduce( ( memo, node ) => {
			if ( ! memo.length && ! node.textContent ) {
				return memo;
			}

			memo.push( node );
			return memo;
		}, [] );

		// Splitting into two blocks
		this.setContent( this.props.value );

		this.props.onSplit(
			nodeListToReact( before, createElement ),
			nodeListToReact( after, createElement )
		);
	}

	onNodeChange() {
		const alignments = this.editor.formatter.matchAll( [ 'alignleft', 'aligncenter', 'alignright' ] );
		const alignment = alignments.length > 0 ? alignmentMap[ alignments[ 0 ] ] : null;
		this.setState( { alignment } );
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
		if ( ! isEqual( this.props.focus, prevProps.focus ) ) {
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

	render() {
		const {
			tagName,
			style,
			value,
			focus,
			className,
			showAlignments = false,
			inlineToolbar = false,
			showFormattingToolbar = true,
			placeholder,
			formattingControls,
		} = this.props;

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount (+ destroy) the previous TinyMCE element, then
		// mount (+ initialize) a new child element in its place.
		const key = [ 'editor', tagName ].join();
		const classes = classnames( className, 'blocks-editable' );

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

						{ showFormattingToolbar &&
							<FormatToolbar editor={ this.editor } enabledControls={ formattingControls } />
						}
					</Fill>
				}

				{ focus && inlineToolbar &&
					<div className="block-editable__inline-toolbar">
						<FormatToolbar editor={ this.editor } enabledControls={ formattingControls } inline />
					</div>
				}

				<TinyMCE
					tagName={ tagName }
					getSettings={ this.getSettings }
					onSetup={ this.onSetup }
					style={ style }
					defaultValue={ value }
					isEmpty={ this.state.empty }
					placeholder={ placeholder }
					key={ key } />
			</div>
		);
	}
}
