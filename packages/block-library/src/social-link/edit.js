/**
 * External dependencies
 */
import classNames from 'classnames';
import { find, get } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	URLPopover,
	URLInput,
	useBlockProps,
	__experimentalUseEditorFeature as useEditorFeature,
} from '@wordpress/block-editor';
import { Fragment, useState, useEffect } from '@wordpress/element';
import {
	Button,
	PanelBody,
	PanelRow,
	TextControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { keyboardReturn } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getIconBySite, getNameBySite } from './social-list';

const SocialLinkEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	context,
} ) => {
	const { url, service, label } = attributes;
	const [ showURLPopover, setPopover ] = useState( false );

	const getColorBySlug = ( colors, slug, customColor ) => {
		return customColor || get( find( colors, { slug } ), 'color' ) || null;
	};

	// Determine colors for this link passed via context from parent.
	const {
		iconColor,
		customIconColor,
		backgroundColor,
		customBackgroundColor,
	} = context;
	const colors = useEditorFeature( 'color.palette' ) || [];
	const rgbIconColor = getColorBySlug( colors, iconColor, customIconColor );
	const rgbBackgroundColor = getColorBySlug(
		colors,
		backgroundColor,
		customBackgroundColor
	);

	useEffect( () => {
		setAttributes( { rgbIconColor, rgbBackgroundColor } );
	}, [ rgbIconColor, rgbBackgroundColor, setAttributes ] );

	const classes = classNames( 'wp-social-link', 'wp-social-link-' + service, {
		'wp-social-link__is-incomplete': ! url,
		'has-text-color': rgbIconColor,
		[ `has-${ iconColor }-color` ]: !! iconColor,
		'has-background': rgbBackgroundColor,
		[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
	} );

	const IconComponent = getIconBySite( service );
	const socialLinkName = getNameBySite( service );
	const blockProps = useBlockProps( {
		className: classes,
		style: {
			color: rgbIconColor,
			backgroundColor: rgbBackgroundColor,
		},
	} );

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody
					title={ sprintf(
						/* translators: %s: name of the social service. */
						__( '%s label' ),
						socialLinkName
					) }
					initialOpen={ false }
				>
					<PanelRow>
						<TextControl
							label={ __( 'Link label' ) }
							help={ __(
								'Briefly describe the link to help screen reader users.'
							) }
							value={ label }
							onChange={ ( value ) =>
								setAttributes( { label: value } )
							}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				<Button onClick={ () => setPopover( true ) }>
					<IconComponent />
					{ isSelected && showURLPopover && (
						<URLPopover onClose={ () => setPopover( false ) }>
							<form
								className="block-editor-url-popover__link-editor"
								onSubmit={ ( event ) => {
									event.preventDefault();
									setPopover( false );
								} }
							>
								<div className="block-editor-url-input">
									<URLInput
										value={ url }
										onChange={ ( nextURL ) =>
											setAttributes( { url: nextURL } )
										}
										placeholder={ __( 'Enter address' ) }
										disableSuggestions={ true }
									/>
								</div>
								<Button
									icon={ keyboardReturn }
									label={ __( 'Apply' ) }
									type="submit"
								/>
							</form>
						</URLPopover>
					) }
				</Button>
			</li>
		</Fragment>
	);
};

export default SocialLinkEdit;
