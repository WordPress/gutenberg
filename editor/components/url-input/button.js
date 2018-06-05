/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, ToggleControl, Popover } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';
import { filterURLForDisplay } from '../../utils/url';
import { prependHTTP } from '@wordpress/url';

const { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } = keycodes;

/**
 * Internal dependencies
 */
import UrlInput from './';
const stopKeyPropagation = ( event ) => event.stopPropagation();

class UrlInputButton extends Component {
	constructor() {
		super( ...arguments );
		this.toggle = this.toggle.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.toggleLinkSettingsVisibility = this.toggleLinkSettingsVisibility.bind( this );
		this.setLinkTarget = this.setLinkTarget.bind( this );
		this.onChangeLinkValue = this.onChangeLinkValue.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.editLink = this.editLink.bind( this );

		this.state = {
			expanded: false,
			isEditing: true,
			settingsVisible: false,
			opensInNewWindow: this.props.attributes.target === '_blank' ? true : false,
			linkValue: this.props.url,
		};
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			this.dropLink();
			this.toggle();
		}
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			stopKeyPropagation( event );
		}
	}

	dropLink() {
		this.props.setAttributes( { href: null } );
		this.setState( { linkValue: '', settingsVisible: false } );
	}

	editLink() {
		this.setState( { isEditing: ! this.state.isEditing } );
	}

	toggle() {
		this.setState( { expanded: ! this.state.expanded } );
	}

	onChangeLinkValue( value ) {
		this.setState( { linkValue: value } );
	}

	submitLink( event ) {
		event.preventDefault();
		const value = prependHTTP( this.state.linkValue );
		this.props.setAttributes( {
			href: value,
		} );
		this.setState( { isEditing: false, linkValue: value } );
	}

	toggleLinkSettingsVisibility() {
		this.setState( ( state ) => ( { settingsVisible: ! state.settingsVisible } ) );
	}

	setLinkTarget( opensInNewWindow ) {
		this.setState( { opensInNewWindow } );
		if ( opensInNewWindow ) {
			this.props.setAttributes( {
				target: '_blank',
				rel: 'noreferrer noopener',
			} );
		} else {
			this.props.setAttributes( {
				target: null,
				rel: null,
			} );
		}
	}

	render() {
		const { url, attributes: { id } } = this.props;
		const { expanded, settingsVisible, opensInNewWindow, linkValue, isEditing } = this.state;
		const buttonLabel = url ? __( 'Edit Link' ) : __( 'Insert Link' );

		const linkSettings = settingsVisible && (
			<div className="editor-format-toolbar__link-modal-line editor-format-toolbar__link-settings">
				<ToggleControl
					label={ __( 'Open in new window' ) }
					checked={ opensInNewWindow }
					onChange={ this.setLinkTarget }
				/>
			</div>
		);

		return (
			<div className="editor-url-input__button" >
				<IconButton
					icon="admin-links"
					label={ buttonLabel }
					onClick={ this.toggle }
					className={ classnames( 'components-toolbar__control', {
						'is-active': url,
					} ) }
				/>
				{
					expanded && (
						<Popover
							position="bottom center"
							focusOnMount={ true }
							key={ id }
						>
							{ isEditing && (
								// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
								/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
								<form
									className="editor-url-input__button-modal"
									onSubmit={ this.submitLink }
									onKeyPress={ stopKeyPropagation }
									onKeyDown={ this.onKeyDown }
								>
									<div className="editor-url-input__button-modal-line">
										<UrlInput value={ linkValue } onKeyPress={ stopKeyPropagation } onChange={ this.onChangeLinkValue } data-test="UrlInput" />
										<IconButton
											icon="editor-break"
											label={ __( 'Submit' ) }
											type="submit"
										/>
										<IconButton
											className="editor-format-toolbar__link-settings-toggle"
											icon="ellipsis"
											label={ __( 'Link Settings' ) }
											onClick={ this.toggleLinkSettingsVisibility }
											aria-expanded={ settingsVisible }
										/>
									</div>
									{ linkSettings }
								</form>
							) }

							{ ! isEditing && (
								// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
								/* eslint-disable jsx-a11y/no-static-element-interactions */
								<div
									className="editor-format-toolbar__link-modal"
									onKeyPress={ stopKeyPropagation }
								>
									<div className="editor-format-toolbar__link-modal-line">
										<a
											className="editor-format-toolbar__link-value"
											href={ url }
											target="_blank"
										>
											{ url && filterURLForDisplay( decodeURI( url ) ) }
										</a>
										<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editLink } />
										<IconButton
											className="editor-format-toolbar__link-settings-toggle"
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
						</Popover>
					)
				}
			</div >
		);
	}
}

export default UrlInputButton;
