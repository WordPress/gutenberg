/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

class NoFollowToggle extends Component {
	isChecked() {
		const { rel } = this.props.attributes;

		if ( ! rel ) {
			return false;
		}

		return rel.split( ' ' ).includes( 'nofollow' );
	}

	toggle() {
		const { setLinkAttributes, attributes } = this.props;

		const rel = attributes.rel;

		if ( this.isChecked() ) {
			if ( ! rel ) {
				return;
			}

			const newRel = rel.split( ' ' ).filter( ( relItem ) => {
				return relItem !== 'nofollow';
			} ).join( ' ' );

			setLinkAttributes( {
				...attributes,
				rel: newRel,
			} );
			return;
		}

		if ( ! rel ) {
			setLinkAttributes( {
				...attributes,
				rel: 'nofollow',
			} );
		} else {
			setLinkAttributes( {
				...attributes,
				rel: [ rel, 'nofollow' ].join( ' ' ),
			} );
		}
	}

	render() {
		return (
			<ToggleControl
				label={ __( 'No Follow' ) }
				checked={ this.isChecked() }
				onChange={ this.toggle.bind( this ) }
			/>
		);
	}
}

export default NoFollowToggle;
