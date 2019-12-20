/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { URLPopover, URLInput } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import {
	Button,
	IconButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getIconBySite } from './social-list';

const SocialLinkEdit = ( { attributes, setAttributes, isSelected } ) => {
	const { url, site } = attributes;
	const [ showURLPopover, setPopover ] = useState( false );
	const classes = classNames(
		'wp-social-link',
		'wp-social-link-' + site,
		{ 'wp-social-link__is-incomplete': ! url },
	);

	// Import icon.
	const IconComponent = getIconBySite( site );

	return (
		<Button
			className={ classes }
			onClick={ () => setPopover( true ) }
		>
			<IconComponent />
			{ isSelected && showURLPopover && (
				<URLPopover
					onClose={ () => setPopover( false ) }
				>
					<form
						className="block-editor-url-popover__link-editor"
						onSubmit={ ( event ) => {
							event.preventDefault();
							setPopover( false );
						} } >
						<URLInput
							value={ url }
							onChange={ ( nextURL ) => setAttributes( { url: nextURL } ) }
							placeholder={ __( 'Enter Address' ) }
							disableSuggestions={ true }
						/>
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
					</form>
				</URLPopover>
			) }
		</Button>
	);
};

export default SocialLinkEdit;
