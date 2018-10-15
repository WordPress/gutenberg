/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { ToolbarButton } from '@wordpress/components';
import {
	getTextContent,
	applyFormat,
	removeFormat,
	slice,
} from '@wordpress/rich-text';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import InlineLinkUI from './inline';

export const link = {
	name: 'core/link',
	title: __( 'Link' ),
	match: {
		tagName: 'a',
	},
	attributes: {
		url: 'href',
		target: 'target',
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
				onChange( applyFormat( value, { type: 'core/link', attributes: { url: text } } ) );
			} else {
				this.setState( { addingLink: true } );
			}
		}

		stopAddingLink() {
			this.setState( { addingLink: false } );
		}

		render() {
			const { isActive, activeAttributes, value, onChange, FillToolbarSlot, Shortcut } = this.props;
			const onRemoveFormat = () => onChange( removeFormat( value, 'core/link' ) );

			return (
				<Fragment>
					<Shortcut
						type="access"
						character="s"
						onUse={ onRemoveFormat }
					/>
					<Shortcut
						type="access"
						character="a"
						onUse={ () => this.addLink() }
					/>
					<Shortcut
						type="primary"
						character="k"
						onUse={ () => this.addLink() }
					/>
					<FillToolbarSlot name="link">
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
					</FillToolbarSlot>
					<InlineLinkUI
						addingLink={ this.state.addingLink }
						stopAddingLink={ this.stopAddingLink }
						isActive={ isActive }
						activeAttributes={ activeAttributes }
						value={ value }
						onChange={ onChange }
					/>
				</Fragment>
			);
		}
	},
};
