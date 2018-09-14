/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Toolbar,
	withSpokenMessages,
} from '@wordpress/components';
import { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { FORMATTING_CONTROLS } from '../formatting-controls';
import LinkContainer from './link-container';
import ToolbarContainer from './toolbar-container';

/**
 * Returns the Format Toolbar state given a set of props.
 *
 * @param {Object} props Component props.
 *
 * @return {Object} State object.
 */
function computeDerivedState( props ) {
	return {
		selectedNodeId: props.selectedNodeId,
		settingsVisible: false,
		opensInNewWindow: !! props.formats.link && !! props.formats.link.target,
		isEditingLink: false,
		linkValue: get( props, [ 'formats', 'link', 'value' ], '' ),
	};
}

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.state = {};

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
			const link = this.props.formats.link;
			const isAddingLink = link && link.isAdding;
			if ( isAddingLink ) {
				event.stopPropagation();
				if ( ! link.value ) {
					this.dropLink();
				} else {
					this.props.onChange( { link: { ...link, isAdding: false } } );
				}
			}
		}
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			// Stop the key event from propagating up to maybeStartTyping in BlockListBlock.
			event.stopPropagation();
		}
	}

	static getDerivedStateFromProps( props, state ) {
		if ( state.selectedNodeId !== props.selectedNodeId ) {
			return computeDerivedState( props );
		}

		return null;
	}

	onChangeLinkValue( value ) {
		this.setState( { linkValue: value } );
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
		if ( this.props.formats.link && ! this.props.formats.link.isAdding ) {
			this.props.onChange( { link: {
				value: this.props.formats.link.value,
				target: opensInNewWindow ? '_blank' : null,
				rel: opensInNewWindow ? 'noreferrer noopener' : null,
			} } );
		}
	}

	addLink() {
		this.props.onChange( { link: { isAdding: true } } );
	}

	dropLink() {
		this.props.onChange( { link: null } );
	}

	editLink( event ) {
		event.preventDefault();
		this.setState( { linkValue: this.props.formats.link.value, isEditingLink: true } );
	}

	submitLink( event ) {
		event.preventDefault();
		const value = prependHTTP( this.state.linkValue );
		this.props.onChange( { link: {
			isAdding: false,
			target: this.state.opensInNewWindow ? '_blank' : null,
			rel: this.state.opensInNewWindow ? 'noreferrer noopener' : null,
			value,
		} } );
		if ( ! this.props.formats.link.value ) {
			this.props.speak( __( 'Link added.' ), 'assertive' );
		}
	}

	isFormatActive( format ) {
		return this.props.formats[ format ] && this.props.formats[ format ].isActive;
	}

	render() {
		const { formats, enabledControls = [], customControls = [], selectedNodeId } = this.props;
		const { linkValue, settingsVisible, opensInNewWindow, isEditingLink } = this.state;
		const isAddingLink = formats.link && formats.link.isAdding;
		const isEditing = isAddingLink || isEditingLink;
		const isPreviewing = ! isEditing && formats.link;

		const toolbarControls = FORMATTING_CONTROLS.concat( customControls )
			.filter( ( control ) => enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => {
				if ( control.format === 'link' ) {
					const isFormatActive = this.isFormatActive( 'link' );
					const isActive = isFormatActive || isAddingLink;
					return {
						...control,
						shortcut: isFormatActive ? control.activeShortcut : control.shortcut,
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

		return (
			<ToolbarContainer>
				<Toolbar controls={ toolbarControls } />

				{ ( isEditing || isPreviewing ) && (
					<LinkContainer
						editLink={ this.editLink }
						formats={ formats }
						isEditing={ isEditing }
						isPreviewing={ isPreviewing }
						linkValue={ linkValue }
						onChangeLinkValue={ this.onChangeLinkValue }
						onKeyDown={ this.onKeyDown }
						opensInNewWindow={ opensInNewWindow }
						selectedNodeId={ selectedNodeId }
						setLinkTarget={ this.setLinkTarget }
						settingsVisible={ settingsVisible }
						submitLink={ this.submitLink }
						toggleLinkSettingsVisibility={ this.toggleLinkSettingsVisibility }
					/>
				) }
			</ToolbarContainer>
		);
	}
}

export default withSpokenMessages( FormatToolbar );
