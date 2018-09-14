/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';
import { rawShortcut } from '@wordpress/keycodes';
import { Component } from '@wordpress/element';
import {
	applyFormat,
	removeFormat,
	getActiveFormat,
	getTextContent,
	slice,
} from '@wordpress/rich-text-structure';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { FORMATTING_CONTROLS } from '../formatting-controls';
import LinkContainer from './link-container';
import ToolbarContainer from './toolbar-container';

class FormatToolbar extends Component {
	constructor( { toggleFormat, editor } ) {
		super( ...arguments );

		this.removeLink = this.removeLink.bind( this );
		this.addLink = this.addLink.bind( this );
		this.stopAddingLink = this.stopAddingLink.bind( this );
		this.applyFormat = this.applyFormat.bind( this );
		this.removeFormat = this.removeFormat.bind( this );
		this.getActiveFormat = this.getActiveFormat.bind( this );
		this.toggleFormat = this.toggleFormat.bind( this );

		this.state = {
			addingLink: false,
		};

		editor.shortcuts.add( rawShortcut.primary( 'k' ), '', this.addLink );
		editor.shortcuts.add( rawShortcut.access( 'a' ), '', this.addLink );
		editor.shortcuts.add( rawShortcut.access( 's' ), '', this.removeLink );
		editor.shortcuts.add( rawShortcut.access( 'd' ), '', () => toggleFormat( { type: 'del' } ) );
		editor.shortcuts.add( rawShortcut.access( 'x' ), '', () => toggleFormat( { type: 'code' } ) );
	}

	removeLink() {
		this.removeFormat( 'a' );
	}

	addLink() {
		const text = getTextContent( slice( this.props.record ) );

		if ( text && isURL( text ) ) {
			this.applyFormat( {
				type: 'a',
				attributes: {
					href: text,
				},
			} );
		} else {
			this.setState( { addingLink: true } );
		}
	}

	stopAddingLink() {
		this.setState( { addingLink: false } );
	}

	/**
	 * Apply a format with the current value and selection.
	 *
	 * @param {Object} format The format to apply.
	 */
	applyFormat( format ) {
		this.props.onChange( applyFormat( this.props.record, format ) );
	}

	/**
	 * Remove a format from the current value with the current selection.
	 *
	 * @param {string} formatType The type of format to remove.
	 */
	removeFormat( formatType ) {
		this.props.onChange( removeFormat( this.props.record, formatType ) );
	}

	/**
	 * Get the current format based on the selection
	 *
	 * @param {string} formatType The type of format to check.
	 *
	 * @return {boolean} Whether the format is active or not.
	 */
	getActiveFormat( formatType ) {
		return getActiveFormat( this.props.record, formatType );
	}

	/**
	 * Toggle a format based on the selection.
	 *
	 * @param {Object} format The format to toggle.
	 */
	toggleFormat( format ) {
		if ( this.getActiveFormat( format.type ) ) {
			this.removeFormat( format.type );
		} else {
			this.applyFormat( format );
		}
	}

	render() {
		const link = this.getActiveFormat( 'a' );
		const toolbarControls = FORMATTING_CONTROLS
			.filter( ( control ) => this.props.enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => {
				if ( control.format === 'link' ) {
					const linkIsActive = link !== undefined;

					return {
						...control,
						shortcut: linkIsActive ? control.activeShortcut : control.shortcut,
						icon: linkIsActive ? 'editor-unlink' : 'admin-links', // TODO: Need proper unlink icon
						title: linkIsActive ? __( 'Unlink' ) : __( 'Link' ),
						onClick: linkIsActive ? this.removeLink : this.addLink,
						isActive: !! linkIsActive,
					};
				}

				return {
					...control,
					onClick: () => this.toggleFormat( { type: control.selector } ),
					isActive: this.getActiveFormat( control.selector ) !== undefined,
				};
			} );

		return (
			<ToolbarContainer>
				<Toolbar controls={ toolbarControls } />
				<LinkContainer
					link={ link }
					record={ this.props.record }
					onChange={ this.props.onChange }
					applyFormat={ this.applyFormat }
					removeFormat={ this.removeFormat }
					getActiveFormat={ this.getActiveFormat }
					toggleFormat={ this.toggleFormat }
					addingLink={ this.state.addingLink }
					stopAddingLink={ this.stopAddingLink }
				/>
			</ToolbarContainer>
		);
	}
}

export default FormatToolbar;
