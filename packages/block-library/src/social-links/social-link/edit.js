/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { URLInput } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import socialList from '../social-list';

// Receives an URL and tries to match to return an icon.
const getIconByURL = ( url ) => {
	const sites = Object.keys( socialList );
	for ( const site of sites ) {
		for ( const match of socialList[ site ] ) {
			if ( url.includes( match ) ) {
				return site;
			}
		}
	}
	// default icon
	return 'share';
};

const SocialLinkEdit = ( { attributes, setAttributes, isSelected } ) => {
	const { icon, url } = attributes;

	const classes = classNames( 'wp-social-icon', `wp-social-icon-${ icon }` );
	return (
		<>
			<span className={ classes }></span>
			{
				isSelected && (
					<URLInput
						value={ url }
						onChange={ ( value ) => {
							const newIcon = getIconByURL( value );
							setAttributes( { url: value, icon: newIcon } );
						} }
					/>
				)
			}
		</>
	);
};

export default SocialLinkEdit;
