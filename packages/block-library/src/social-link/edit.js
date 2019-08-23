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

const SocialLinkEdit = ( { className, attributes, setAttributes, isSelected } ) => {
	const { url } = attributes;
	const [ showURLPopover, setPopover ] = useState( true );

	// can we read the block settings somehow to get icon?
	const icon = className.replace( 'wp-block-social-link-', '' );
	setAttributes( { icon } );

	const classes = classNames( 'wp-social-icon', `wp-social-icon-${ icon }`, { 'wp-social-icon__is-incomplete': ( url ) ? false : true } );
	return (
		<>
			<Button
				className={ classes }
				onClick={ () => setPopover( true ) }
			>
				{ isSelected && showURLPopover && (
					<Popover
						onFocusOutside={ () => setPopover( false ) }
						position="bottom center"
					>
						<URLInput
							value={ url }
							onChange={ ( value ) => setAttributes( { url: value } ) }
							disableSuggestions={ true }
						/>
					</Popover>
				) }
			</Button>
		</>
	);
};

export default SocialLinkEdit;
