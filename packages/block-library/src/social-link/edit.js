/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { InspectorControls, URLPopover } from '@wordpress/block-editor';
import { Fragment, useState } from '@wordpress/element';
import {
	Button,
	IconButton,
	PanelBody,
	PanelRow,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getIconBySite, getNameBySite } from './social-list';

const SocialLinkEdit = ( { attributes, setAttributes, isSelected } ) => {
	const { url, site, label } = attributes;
	const [ showURLPopover, setPopover ] = useState( false );
	const classes = classNames(
		'wp-social-link',
		'wp-social-link-' + site,
		{ 'wp-social-link__is-incomplete': ! url },
	);

	// Import icon.
	const IconComponent = getIconBySite( site );
	const SocialLinkName = getNameBySite( site );

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={ `${ SocialLinkName }` + __( ' Label' ) } initialOpen={ false }>
					<PanelRow>
						<TextControl
							label={ __( 'Link Label' ) }
							help={ __( 'Briefly describe the link to help screen reader users.' ) }
							value={ label }
							onChange={ ( value ) => setAttributes( { label: value } ) }
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
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
							<div className="editor-url-input block-editor-url-input">
								<input type="text"
									value={ url }
									onChange={ ( event ) => setAttributes( { url: event.target.value } ) }
									placeholder={ __( 'Enter Address' ) }
								/>
							</div>
							<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
						</form>
					</URLPopover>
				) }
			</Button>
		</Fragment>
	);
};

export default SocialLinkEdit;
