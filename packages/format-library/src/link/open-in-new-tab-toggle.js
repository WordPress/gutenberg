/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Fill, ToggleControl } from '@wordpress/components';
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
			if ( typeof attributes.rel === 'string' ) {
				attributes.rel = attributes.rel.split( ' ' ).filter( ( relItem ) => {
					return relItem !== 'noopener' && relItem !== 'noreferrer';
				} ).join( ' ' ).trim();
			} else {
				delete attributes.rel;
			}

			delete attributes.target;
			attributes[ 'aria-label' ] = label;

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

const OpenInNewTabToggleWrapper = () => {
	return (
		<Fill name="LinkSettings">
			{ ( props ) => (
				<OpenInNewTabToggle { ...props } />
			) }
		</Fill>
	);
};

export default OpenInNewTabToggleWrapper;
