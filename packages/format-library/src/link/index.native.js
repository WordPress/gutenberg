/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withSpokenMessages } from '@wordpress/components';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	applyFormat,
	getActiveFormat,
	getTextContent,
	isCollapsed,
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

		getLinkSelection() {
			const { value, isActive } = this.props;
			const startFormat = getActiveFormat( value, 'core/link' );

			// if the link isn't selected, get the link manually by looking around the cursor
			// TODO: handle partly selected links
			if ( startFormat && isCollapsed( value ) && isActive ) {
				let startIndex = value.start;
				let endIndex = value.end;

				while ( find( value.formats[ startIndex ], startFormat ) ) {
					startIndex--;
				}

				endIndex++;

				while ( find( value.formats[ endIndex ], startFormat ) ) {
					endIndex++;
				}

				return {
					...value,
					start: startIndex + 1,
					end: endIndex,
				};
			}

			return value;
		}

		onRemoveFormat() {
			const { onChange, speak } = this.props;
			const linkSelection = this.getLinkSelection();

			onChange( removeFormat( linkSelection, name ) );
			speak( __( 'Link removed.' ), 'assertive' );
		}

		render() {
			const { isActive, activeAttributes, onChange } = this.props;
			const linkSelection = this.getLinkSelection();

			return (
				<>
					<ModalLinkUI
						isVisible={ this.state.addingLink }
						isActive={ isActive }
						activeAttributes={ activeAttributes }
						onClose={ this.stopAddingLink }
						onChange={ onChange }
						onRemove={ this.onRemoveFormat }
						value={ linkSelection }
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
				</>
			);
		}
	} ),
};
