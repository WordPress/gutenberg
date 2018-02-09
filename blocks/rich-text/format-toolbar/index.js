/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, Toolbar, withSpokenMessages, Fill } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import UrlInput from '../../url-input';
import { LINK_PLACEHOLDER_VALUE } from '../';
import { filterURLForDisplay } from '../../../editor/utils/url';

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
	{
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
			isEditingLink: false,
			newLinkValue: '',
		};

		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeLinkValue = this.onChangeLinkValue.bind( this );
	}

	onKeyDown( event ) {
		event.stopPropagation();

		if ( event.keyCode === ESCAPE ) {
			this.setState( { isEditingLink: false, newLinkValue: '' } );

			if ( this.props.formats.link.value === LINK_PLACEHOLDER_VALUE ) {
				this.dropLink();
			}
		}
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.selectedNodeId !== nextProps.selectedNodeId ) {
			this.setState( {
				isEditingLink: false,
				newLinkValue: '',
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

	addLink() {
		this.props.onChange( { link: { value: LINK_PLACEHOLDER_VALUE } } );
	}

	dropLink() {
		this.props.onChange( { link: undefined } );
	}

	editLink( event ) {
		event.preventDefault();
		this.setState( { isEditingLink: true, newLinkValue: this.props.formats.link.value } );
	}

	submitLink( event ) {
		event.preventDefault();

		this.setState( { isEditingLink: false, newLinkValue: '' } );

		if ( this.props.formats.link.value === LINK_PLACEHOLDER_VALUE ) {
			this.props.speak( __( 'Link added.' ), 'assertive' );
		}

		this.props.onChange( { link: { value: this.state.newLinkValue } } );
	}

	isFormatActive( format ) {
		return this.props.formats[ format ] && this.props.formats[ format ].isActive;
	}

	render() {
		const { formats, focusPosition, enabledControls = DEFAULT_CONTROLS, customControls = [] } = this.props;
		const { isEditingLink, newLinkValue } = this.state;

		const toolbarControls = FORMATTING_CONTROLS.concat( customControls )
			.filter( control => enabledControls.includes( control.format ) )
			.map( ( control ) => {
				const isActive = this.isFormatActive( control.format );

				if ( control.format === 'link' ) {
					return {
						...control,
						icon: isActive ? 'editor-unlink' : 'admin-links', // TODO: proper unlink icon
						title: isActive ? __( 'Unlink' ) : __( 'Link' ),
						isActive,
						onClick: isActive ? this.dropLink : this.addLink,
					};
				}

				return {
					...control,
					isActive,
					onClick: this.toggleFormat( control.format ),
				};
			} );

		const hasLinkUI = !! formats.link;
		const hasEditLinkUI = hasLinkUI && ( isEditingLink || formats.link.value === LINK_PLACEHOLDER_VALUE );
		const hasViewLinkUI = hasLinkUI && ! isEditingLink && formats.link.value !== LINK_PLACEHOLDER_VALUE;

		return (
			<div className="blocks-format-toolbar">
				<Toolbar controls={ toolbarControls } />

				{ hasLinkUI &&
					<Fill name="RichText.Siblings">
						<div style={ focusPosition && { position: 'absolute', ...focusPosition } }>
							{ hasEditLinkUI &&
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
									</div>
								</form>
								/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
							}

							{ hasViewLinkUI &&
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
									</div>
								</div>
								/* eslint-enable jsx-a11y/no-static-element-interactions */
							}
						</div>
					</Fill>
				}
			</div>
		);
	}
}

export default withSpokenMessages( FormatToolbar );
