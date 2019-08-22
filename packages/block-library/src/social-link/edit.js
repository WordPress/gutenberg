/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { URLInput } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import {
	Button,
	Popover,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import socialList from './social-list';
import IconPicker from './icon-picker';

const SocialLinkEdit = ( { attributes, setAttributes, isSelected } ) => {
	const { icon, url } = attributes;
	const [ showURLPopover, setPopover ] = useState( true );

	const classes = classNames( 'wp-social-icon', `wp-social-icon-${ icon }` );
	return (
		<>
			{ icon && (
				<Button
					className={ classes }
					onClick={ () => setPopover( true ) }
				>
					{ isSelected && showURLPopover && (
						<Popover
							onFocusOutside={ () => setPopover( false ) }
						>
							<URLInput
								value={ url }
								onChange={ ( value ) => setAttributes( { url: value } ) }
								disableSuggestions={ true }
							/>
						</Popover>
					) }
				</Button>
			) }
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
