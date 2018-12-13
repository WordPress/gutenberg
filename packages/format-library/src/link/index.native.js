/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { withSpokenMessages } from '@wordpress/components';
import { RichTextToolbarButton } from '@wordpress/editor';
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
import ModalLinkUI from './modal';

const name = 'core/link';

export const link = {
	name,
	title: __( 'Link' ),
	tagName: 'a',
	className: null,
	attributes: {
		url: 'href',
		target: 'target',
	},
	edit: withSpokenMessages( class LinkEdit extends Component {
		constructor() {
			super( ...arguments );

			this.addLink = this.addLink.bind( this );
			this.stopAddingLink = this.stopAddingLink.bind( this );
			this.onRemoveFormat = this.onRemoveFormat.bind( this );
			this.state = {
				addingLink: false,
			};
		}

		addLink() {
			const { value, onChange } = this.props;
			const text = getTextContent( slice( value ) );

			if ( text && isURL( text ) ) {
				onChange( applyFormat( value, { type: name, attributes: { url: text } } ) );
			} else {
				this.setState( { addingLink: true } );
			}
		}

		stopAddingLink() {
			this.setState( { addingLink: false } );
		}

		onRemoveFormat() {
			const { value, onChange, speak } = this.props;

			onChange( removeFormat( value, name ) );
			speak( __( 'Link removed.' ), 'assertive' );
		}

		render() {
			const { isActive, value } = this.props;

			return (
				<Fragment>
					<ModalLinkUI
						isVisible={ this.state.addingLink }
						onClose={ this.stopAddingLink }
						value={ value }
					/>
					<RichTextToolbarButton
						name="link"
						icon="admin-links"
						title={ __( 'Link' ) }
						onClick={ this.addLink }
						isActive={ isActive }
						shortcutType="primary"
						shortcutCharacter="k"
					/>
				</Fragment>
			);
		}
	} ),
};
