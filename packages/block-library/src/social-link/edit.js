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

const SocialLinkEdit = ( { attributes, setAttributes } ) => {
	const { icon, url } = attributes;

	const classes = classNames( 'wp-social-icon', `wp-social-icon-${ icon }` );
	return (
		<>
			{ icon && (
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
						<URLInput
							value={ url }
							onChange={ ( value ) => setAttributes( { url: value } ) }
							disableSuggestions={ true }
						/>
					) }
				/> )
			}
			{ ! icon &&
				<IconPicker
					icons={ Object.keys( socialList ) }
					onClick={ ( value ) => setAttributes( { icon: value } ) }
				/>
			}
		</>
	);
};

export default SocialLinkEdit;
