/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, Toolbar, withSpokenMessages } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import UrlInput from '../../url-input';
import { filterURLForDisplay } from '../../../editor/utils/url';
import ToggleControl from '../../inspector-controls/toggle-control';

const { ESCAPE } = keycodes;

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		format: 'italic',
	},
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		format: 'strikethrough',
	},
];

// Default controls shown if no `enabledControls` prop provided
const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link' ];

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isAddingLink: false,
			isEditingLink: false,
			settingsVisible: false,
			opensInNewWindow: false,
			newLinkValue: '',
			showFootnoteEntry: false,
			footnote: '',
		};

		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeLinkValue = this.onChangeLinkValue.bind( this );
		this.toggleLinkSettingsVisibility = this.toggleLinkSettingsVisibility.bind( this );
		this.setLinkTarget = this.setLinkTarget.bind( this );

		this.addFootnote = this.addFootnote.bind( this );
		this.onFootnoteChange = this.onFootnoteChange.bind( this );
		this.submitFootnote = this.submitFootnote.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			if ( this.state.isEditingLink ) {
				event.stopPropagation();
				this.dropLink();
			}
		}
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.selectedNodeId !== nextProps.selectedNodeId ) {
			this.setState( {
				isAddingLink: false,
				isEditingLink: false,
				settingsVisible: false,
				opensInNewWindow: !! nextProps.formats.link && !! nextProps.formats.link.target,
				newLinkValue: '',
				showFootnoteEntry: false,
				foonote: '',
			} );
		}
	}

	onChangeLinkValue( value ) {
		this.setState( { newLinkValue: value } );
	}

	toggleFormat( format ) {
		return () => {
			this.props.onChange( {
				[ format ]: ! this.props.formats[ format ],
			} );
		};
	}

	toggleLinkSettingsVisibility() {
		this.setState( ( state ) => ( { settingsVisible: ! state.settingsVisible } ) );
	}

	setLinkTarget( event ) {
		const opensInNewWindow = event.target.checked;
		this.setState( { opensInNewWindow } );
		this.props.onChange( { link: { value: this.props.formats.link.value, target: opensInNewWindow ? '_blank' : '' } } );
	}

	addLink() {
		this.setState( { isEditingLink: false, isAddingLink: true, newLinkValue: '' } );
	}

	dropLink() {
		this.props.onChange( { link: undefined } );
		this.setState( { isEditingLink: false, isAddingLink: false, newLinkValue: '' } );
	}

	editLink( event ) {
		event.preventDefault();
		this.setState( { isEditingLink: false, isAddingLink: true, newLinkValue: this.props.formats.link.value } );
	}

	submitLink( event ) {
		event.preventDefault();
		this.props.onChange( { link: { value: this.state.newLinkValue, target: this.state.opensInNewWindow ? '_blank' : '' } } );
		if ( this.state.isAddingLink ) {
			this.props.speak( __( 'Link inserted.' ), 'assertive' );
		}
	}

	onFootnoteChange( event ) {
		this.setState( { footnote: event.target.value } );
	}

	addFootnote() {
		this.setState( { showFootnoteEntry: true } );
	}

	submitFootnote( event ) {
		event.preventDefault();

		this.props.onChange( { footnote: { text: this.state.footnote } } );
	}

	render() {
		const { formats, focusPosition, enabledControls = DEFAULT_CONTROLS } = this.props;
		const { isAddingLink, isEditingLink, newLinkValue, settingsVisible, opensInNewWindow, showFootnoteEntry, footnote } = this.state;
		const linkStyle = focusPosition
			? { position: 'absolute', ...focusPosition }
			: null;

		const isNodeFootnote = formats.link && formats.link.node.getAttribute( 'data-footnote-id' );

		const toolbarControls = FORMATTING_CONTROLS
			.filter( control => enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => ( {
				...control,
				onClick: this.toggleFormat( control.format ),
				isActive: !! formats[ control.format ],
			} ) );

		const linkSettings = settingsVisible && (
			<fieldset className="blocks-format-toolbar__link-settings">
				<ToggleControl
					label={ __( 'Open in new window' ) }
					checked={ opensInNewWindow }
					onChange={ this.setLinkTarget } />
			</fieldset>
		);

		if ( enabledControls.indexOf( 'link' ) !== -1 ) {
			toolbarControls.push( {
				icon: 'admin-links',
				title: __( 'Link' ),
				onClick: this.addLink,
				isActive: ( isAddingLink || !! formats.link ) && ! isNodeFootnote,
			} );
		}

		toolbarControls.push( {
			icon: 'format-audio',
			title: __( 'Footnote' ),
			onClick: this.addFootnote,
			isActive: isNodeFootnote,
		} );

		return (
			<div className="blocks-format-toolbar">
				<Toolbar controls={ toolbarControls } />

				{ ( isAddingLink || isEditingLink ) &&
					<form
						className="blocks-format-toolbar__link-modal"
						style={ linkStyle }
						onSubmit={ this.submitLink }>
						<UrlInput value={ newLinkValue } onChange={ this.onChangeLinkValue } />
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
						<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropLink } />
						<IconButton icon="admin-generic" onClick={ this.toggleLinkSettingsVisibility } aria-expanded={ settingsVisible } />
						{ linkSettings }
					</form>
				}

				{ ! isNodeFootnote && !! formats.link && ! isAddingLink && ! isEditingLink &&
					<div className="blocks-format-toolbar__link-modal" style={ linkStyle }>
						<a
							className="blocks-format-toolbar__link-value"
							href={ formats.link.value }
							target="_blank"
						>
							{ formats.link.value && filterURLForDisplay( decodeURI( formats.link.value ) ) }
						</a>
						<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editLink } />
						<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropLink } />
						<IconButton icon="admin-generic" onClick={ this.toggleLinkSettingsVisibility } aria-expanded={ settingsVisible } />
						{ linkSettings }
					</div>
				}

				{ ( isNodeFootnote || showFootnoteEntry ) &&
					<form
						style={ linkStyle }
						className="blocks-format-toolbar__footnote-modal"
						onSubmit={ this.submitFootnote }>
						<textarea value={ footnote } onChange={ this.onFootnoteChange } placeholder={ __( 'Footnote' ) } />
						<IconButton icon="yes" type="submit" label={ __( 'Apply' ) } />
					</form>
				}
			</div>
		);
	}
}

export default withSpokenMessages( FormatToolbar );
