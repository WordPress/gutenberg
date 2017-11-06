/**
 * External dependencies
 */
import { isBoolean } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import UrlInput from '../url-input';
import { filterURLForDisplay } from '../../editor/utils/url';
import ToggleControl from '../inspector-controls/toggle-control';

export default class LinkEditor extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			settingsVisible: false,
			newLinkValue: '',
			isEditing: null,
		};

		this.onChangeLinkValue = this.onChangeLinkValue.bind( this );
		this.toggleLinkSettingsVisibility = this.toggleLinkSettingsVisibility.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.editClicked = this.editClicked.bind( this );
		this.dropClicked = this.dropClicked.bind( this );
	}

	componentWillReceiveProps( nextProps ) {
		if ( isBoolean( nextProps.isEditing ) ) {
			this.setState( { isEditing: nextProps.isEditing } );
		} else if ( this.state.isEditing === null ) {
			this.setState( { isEditing: ! nextProps.linkValue } );
		}
	}

	onChangeLinkValue( value ) {
		this.setState( { newLinkValue: value } );
	}

	toggleLinkSettingsVisibility() {
		this.setState( ( state ) => ( { settingsVisible: ! state.settingsVisible } ) );
	}

	submitLink( event ) {
		event.preventDefault();
		this.setState( {
			isEditing: false,
		} );
		this.props.onLinkChange( this.state.newLinkValue );
	}

	editClicked() {
		this.setState( {
			newLinkValue: this.props.linkValue,
			isEditing: true,
		} );
		if ( this.props.onEdit ) {
			this.props.onEdit();
		}
	}

	dropClicked() {
		this.setState( {
			newLinkValue: '',
			isEditing: true,
		} );
		this.props.onDrop();
	}

	render() {
		const { linkValue, linkStyle, opensInNewWindow, toggleOpensInNewWindow } = this.props;
		const { isEditing, settingsVisible, newLinkValue } = this.state;
		const linkSettings = settingsVisible && (
			<fieldset className="blocks-link-editor__link-settings">
				<ToggleControl
					label={ __( 'Open in new window' ) }
					checked={ !! opensInNewWindow }
					onChange={ toggleOpensInNewWindow }
				/>
			</fieldset>
		);

		if ( isEditing ) {
			return (
				<form className="blocks-link-editor__link-modal"
					style={ linkStyle }
					onSubmit={ this.submitLink }>
					<UrlInput value={ newLinkValue } onChange={ this.onChangeLinkValue } />
					<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
					<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropClicked } />
					<IconButton icon="admin-generic" onClick={ this.toggleLinkSettingsVisibility } aria-expanded={ settingsVisible } />
					{ linkSettings }
				</form>
			);
		}

		return (
			<div className="blocks-link-editor__link-modal" style={ linkStyle }>
				<a className="blocks-link-editor__link-value"
					href={ linkValue }
					target="_blank">
					{ linkValue && filterURLForDisplay( decodeURI( linkValue ) ) }
				</a>
				<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editClicked } />
				<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropClicked } />
				<IconButton icon="admin-generic" onClick={ this.toggleLinkSettingsVisibility } aria-expanded={ settingsVisible } />
				{ linkSettings }
			</div>
		);
	}
}
