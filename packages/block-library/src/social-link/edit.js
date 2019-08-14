/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { URLInput } from '@wordpress/block-editor';
import {
	Button,
	Dropdown,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import socialList from './social-list';
import IconPicker from './icon-picker';

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
	return null;
};

const SocialLinkEdit = ( { attributes, setAttributes, isSelected } ) => {
	const { icon, url } = attributes;

	const classes = classNames( 'wp-social-icon', `wp-social-icon-${ icon }` );
	return (
		<>
			<Dropdown
				className="wp-block-social-link__icon-picker-dropdown"
				position="bottom right"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						className={ classes }
						onClick={ onToggle }
						aria-expanded={ isOpen }
					></Button>
				) }
				renderContent={ () => (
					<IconPicker
						icons={ Object.keys( socialList ) }
						onClick={ ( value ) => setAttributes( { icon: value } ) }
					/>
				) }
			/>
			{
				isSelected && (
					<URLInput
						value={ url }
						onChange={ ( value ) => {
							const iconByURL = getIconByURL( value );
							const newIcon = ( iconByURL ) ? iconByURL : icon;
							setAttributes( { url: value, icon: newIcon } );
						} }
					/>
				)
			}
		</>
	);
};

export default SocialLinkEdit;
