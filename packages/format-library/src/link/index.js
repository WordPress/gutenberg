/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { Fill, ToolbarButton } from '@wordpress/components';
import {
	getTextContent,
	applyFormat,
	removeFormat,
	slice,
	getActiveFormat,
} from '@wordpress/rich-text';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import InlineLinkUI from './inline';

const Shortcut = () => null;

export const link = {
	name: 'core/link',
	title: __( 'Link' ),
	match: {
		tagName: 'a',
	},
	attributes: {
		url: 'href',
	},
	edit: class LinkEdit extends Component {
		constructor() {
			super( ...arguments );

			this.addLink = this.addLink.bind( this );
			this.stopAddingLink = this.stopAddingLink.bind( this );
			this.state = {
				addingLink: false,
			};
		}

		addLink() {
			const { value, onChange } = this.props;
			const text = getTextContent( slice( value ) );

			if ( text && isURL( text ) ) {
				onChange( applyFormat( value, { type: 'a', attributes: { href: text } } ) );
			} else {
				this.setState( { addingLink: true } );
			}
		}

		stopAddingLink() {
			this.setState( { addingLink: false } );
		}

		render() {
			const { isActive, value, onChange } = this.props;
			const onRemoveFormat = () => onChange( removeFormat( value, 'a' ) );

			return (
				<Fragment>
					<Shortcut
						type="access"
						key="s"
						onUseShortcut={ onRemoveFormat }
					/>
					<Shortcut
						type="access"
						key="a"
						onUseShortcut={ () => this.addLink() }
					/>
					<Shortcut
						type="primary"
						key="k"
						onUseShortcut={ () => this.addLink() }
					/>
					<Fill name="RichText.ToolbarControls.link">
						{ isActive && <ToolbarButton
							icon="editor-unlink"
							title={ __( 'Unlink' ) }
							onClick={ onRemoveFormat }
							isActive={ isActive }
						/> }
						{ ! isActive && <ToolbarButton
							icon="admin-links"
							title={ __( 'Link' ) }
							onClick={ () => this.addLink() }
							isActive={ isActive }
						/> }
					</Fill>
					<InlineLinkUI
						addingLink={ this.state.addingLink }
						stopAddingLink={ this.stopAddingLink }
						link={ getActiveFormat( value, 'a' ) }
						value={ value }
						onChange={ onChange }
					/>
				</Fragment>
			);
		}
	},
};
