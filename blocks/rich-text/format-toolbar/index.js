/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Fill,
	IconButton,
	ToggleControl,
	Toolbar,
	withSpokenMessages,
} from '@wordpress/components';
import { keycodes } from '@wordpress/utils';
import { prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { primaryShortcut, accessShortcut } from 'utils/keycodes';
import './style.scss';
import UrlInput from '../../url-input';
import { filterURLForDisplay } from '../../../editor/utils/url';

const { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } = keycodes;

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		shortcut: primaryShortcut( 'B' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		shortcut: primaryShortcut( 'I' ),
		format: 'italic',
	},
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		shortcut: accessShortcut( 'D' ),
		format: 'strikethrough',
	},
	{
		icon: 'admin-links',
		title: __( 'Link' ),
		shortcut: primaryShortcut( 'K' ),
		format: 'link',
	},
];

// Default controls shown if no `enabledControls` prop provided
const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link' ];

// Stop the key event from propagating up to maybeStartTyping in BlockListBlock
const stopKeyPropagation = ( event ) => event.stopPropagation();

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isAddingLink: false,
			isEditingLink: false,
			settingsVisible: false,
			opensInNewWindow: false,
			newLinkValue: '',
		};

		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeLinkValue = this.onChangeLinkValue.bind( this );
		this.toggleLinkSettingsVisibility = this.toggleLinkSettingsVisibility.bind( this );
		this.setLinkTarget = this.setLinkTarget.bind( this );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			if ( this.state.isEditingLink || this.state.isAddingLink ) {
				event.stopPropagation();
				this.dropLink();
			}
		}
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			stopKeyPropagation( event );
		}
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.selectedNodeId !== nextProps.selectedNodeId ) {
			this.setState( {
				isEditingLink: false,
				settingsVisible: false,
				opensInNewWindow: !! nextProps.formats.link && !! nextProps.formats.link.target,
				newLinkValue: '',
			} );
		}

		this.setState( {
			isAddingLink: !! nextProps.formats.link && nextProps.formats.link.isAdding,
		} );
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

	setLinkTarget( opensInNewWindow ) {
		this.setState( { opensInNewWindow } );
		if ( this.props.formats.link ) {
			this.props.onChange( { link: {
				value: this.props.formats.link.value,
				target: opensInNewWindow ? '_blank' : null,
				rel: opensInNewWindow ? 'noreferrer noopener' : null,
			} } );
		}
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
		this.setState( { isEditingLink: false, isAddingLink: false, newLinkValue: '' } );
		this.props.onChange( { link: {
			value: prependHTTP( this.state.newLinkValue ),
			target: this.state.opensInNewWindow ? '_blank' : null,
			rel: this.state.opensInNewWindow ? 'noreferrer noopener' : null,
		} } );
		if ( this.state.isAddingLink ) {
			this.props.speak( __( 'Link added.' ), 'assertive' );
		}
	}

	isFormatActive( format ) {
		return this.props.formats[ format ] && this.props.formats[ format ].isActive;
	}

	render() {
		const { formats, focusPosition, enabledControls = DEFAULT_CONTROLS, customControls = [] } = this.props;
		const { isAddingLink, isEditingLink, newLinkValue, settingsVisible, opensInNewWindow } = this.state;

		const toolbarControls = FORMATTING_CONTROLS.concat( customControls )
			.filter( ( control ) => enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => {
				if ( control.format === 'link' ) {
					const isFormatActive = this.isFormatActive( 'link' );
					const isActive = isFormatActive || isAddingLink;
					return {
						...control,
						icon: isFormatActive ? 'editor-unlink' : 'admin-links', // TODO: Need proper unlink icon
						title: isFormatActive ? __( 'Unlink' ) : __( 'Link' ),
						onClick: isActive ? this.dropLink : this.addLink,
						isActive,
					};
				}

				return {
					...control,
					onClick: this.toggleFormat( control.format ),
					isActive: this.isFormatActive( control.format ),
				};
			} );

		const linkSettings = settingsVisible && (
			<div className="blocks-format-toolbar__link-modal-line blocks-format-toolbar__link-settings">
				<ToggleControl
					label={ __( 'Open in new window' ) }
					checked={ opensInNewWindow }
					onChange={ this.setLinkTarget } />
			</div>
		);

		return (
			<div className="blocks-format-toolbar">
				<Toolbar controls={ toolbarControls } />

				{ ( isAddingLink || isEditingLink || formats.link ) && (
					<Fill name="RichText.Siblings">
						<div className="blocks-format-toolbar__link-container" style={ { ...focusPosition } }>
							{ ( isAddingLink || isEditingLink ) && (
								// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
								/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
								<form
									className="blocks-format-toolbar__link-modal"
									onKeyPress={ stopKeyPropagation }
									onKeyDown={ this.onKeyDown }
									onSubmit={ this.submitLink }>
									<div className="blocks-format-toolbar__link-modal-line">
										<UrlInput value={ newLinkValue } onChange={ this.onChangeLinkValue } />
										<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
										<IconButton
											className="blocks-format-toolbar__link-settings-toggle"
											icon="ellipsis"
											label={ __( 'Link Settings' ) }
											onClick={ this.toggleLinkSettingsVisibility }
											aria-expanded={ settingsVisible }
										/>
									</div>
									{ linkSettings }
								</form>
								/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
							) }

							{ formats.link && ! isAddingLink && ! isEditingLink && (
								// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
								/* eslint-disable jsx-a11y/no-static-element-interactions */
								<div
									className="blocks-format-toolbar__link-modal"
									onKeyPress={ stopKeyPropagation }
								>
									<div className="blocks-format-toolbar__link-modal-line">
										<a
											className="blocks-format-toolbar__link-value"
											href={ formats.link.value }
											target="_blank"
										>
											{ formats.link.value && filterURLForDisplay( decodeURI( formats.link.value ) ) }
										</a>
										<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editLink } />
										<IconButton
											className="blocks-format-toolbar__link-settings-toggle"
											icon="ellipsis"
											label={ __( 'Link Settings' ) }
											onClick={ this.toggleLinkSettingsVisibility }
											aria-expanded={ settingsVisible }
										/>
									</div>
									{ linkSettings }
								</div>
								/* eslint-enable jsx-a11y/no-static-element-interactions */
							) }
						</div>
					</Fill>
				) }
			</div>
		);
	}
}

export default withSpokenMessages( FormatToolbar );
