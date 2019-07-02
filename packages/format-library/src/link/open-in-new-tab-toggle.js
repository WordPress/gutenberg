/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

class OpenInNewTabToggle extends Component {
	constructor() {
		super( ...arguments );

		this.setLinkTarget = this.setLinkTarget.bind( this );
	}

	setLinkTarget( opensInNewWindow ) {
		const { attributes = {}, setLinkAttributes } = this.props;
		const label = this.getLabel( opensInNewWindow );

		if ( opensInNewWindow ) {
			let rel = 'noopener noreferrer';

			if ( attributes.rel ) {
				rel = [ rel, attributes.rel ].join( ' ' );
			}

			setLinkAttributes( {
				'aria-label': label,
				target: '_blank',
				rel,
				...attributes,
			} );
		} else {
			if ( typeof attributes.rel === 'string' && attributes.rel.length > 0 ) {
				attributes.rel = attributes.rel.split( ' ' ).filter( ( relItem ) => {
					return relItem !== 'noopener' && relItem !== 'noreferrer';
				} ).join( ' ' ).trim();

				if ( attributes.rel.length === 0 ) {
					delete attributes.rel;
				}
			}

			delete attributes.target;

			if ( typeof label === 'string' && label.length > 0 ) {
				attributes[ 'aria-label' ] = label;
			} else {
				delete attributes[ 'aria-label' ];
			}

			setLinkAttributes( attributes );
		}
	}

	getLabel( opensInNewWindow ) {
		const { text } = this.props;

		if ( opensInNewWindow ) {
			return sprintf( __( '%s (opens in a new tab)' ), text );
		}

		return text;
	}

	render() {
		return (
			<ToggleControl
				label={ __( 'Open in New Tab' ) }
				checked={ this.props.attributes.target === '_blank' }
				onChange={ this.setLinkTarget }
			/>
		);
	}
}

export default OpenInNewTabToggle;
