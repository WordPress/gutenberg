/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { DELETE, BACKSPACE } from '@wordpress/keycodes';
import { useDispatch } from '@wordpress/data';

import {
	InspectorControls,
	URLPopover,
	URLInput,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import {
	Button,
	PanelBody,
	PanelRow,
	TextControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { keyboardReturn } from '@wordpress/icons';
import { isURL, isEmail } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	getIconBySite,
	getNameBySite,
	getMatchingService,
} from './social-list';

const SocialLinkURLPopover = ( {
	url,
	setAttributes,
	onClose,
	popoverAnchor,
	clientId,
} ) => {
	const { removeBlock } = useDispatch( blockEditorStore );
	return (
		<URLPopover anchor={ popoverAnchor } onClose={ () => onClose( false ) }>
			<form
				className="block-editor-url-popover__link-editor"
				onSubmit={ ( event ) => {
					event.preventDefault();
					onClose( false );
				} }
			>
				<div className="block-editor-url-input">
					<URLInput
						__nextHasNoMarginBottom
						value={ url }
						onChange={ ( nextURL ) => {
							const nextAttributes = {
								url: nextURL,
								service: undefined,
							};

							if ( isURL( nextURL ) || isEmail( nextURL ) ) {
								const matchingService = isEmail( nextURL )
									? 'mail'
									: getMatchingService( nextURL );

								nextAttributes.service =
									matchingService ?? 'chain';
							}

							setAttributes( nextAttributes );
						} }
						placeholder={ __( 'Enter address' ) }
						disableSuggestions
						onKeyDown={ ( event ) => {
							if (
								!! url ||
								event.defaultPrevented ||
								! [ BACKSPACE, DELETE ].includes(
									event.keyCode
								)
							) {
								return;
							}
							removeBlock( clientId );
						} }
					/>
				</div>
				<Button
					icon={ keyboardReturn }
					label={ __( 'Apply' ) }
					type="submit"
				/>
			</form>
		</URLPopover>
	);
};

const SocialLinkEdit = ( {
	attributes,
	context,
	isSelected,
	setAttributes,
	clientId,
} ) => {
	const { url, service, label, rel } = attributes;
	const {
		showLabels,
		iconColor,
		iconColorValue,
		iconBackgroundColor,
		iconBackgroundColorValue,
	} = context;
	const classes = classNames( 'wp-social-link', {
		[ `wp-social-link-${ service }` ]: !! service,
		'wp-social-link__is-incomplete': ! url,
		[ `has-${ iconColor }-color` ]: iconColor,
		[ `has-${ iconBackgroundColor }-background-color` ]:
			iconBackgroundColor,
	} );

	const [ showPopover, setShowPopover ] = useState( ! url && ! service );
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	const IconComponent = getIconBySite( service );
	const socialLinkName = getNameBySite( service );
	const socialLinkLabel = label ?? socialLinkName;
	const blockProps = useBlockProps( {
		className: classes,
		style: {
			color: iconColorValue,
			backgroundColor: iconBackgroundColorValue,
		},
	} );

	return (
		<>
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
							__nextHasNoMarginBottom
							label={ __( 'Link label' ) }
							help={ __(
								'Briefly describe the link to help screen reader users.'
							) }
							value={ label || '' }
							onChange={ ( value ) =>
								setAttributes( { label: value || undefined } )
							}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Link rel' ) }
					value={ rel || '' }
					onChange={ ( value ) => setAttributes( { rel: value } ) }
				/>
			</InspectorControls>
			<li { ...blockProps }>
				<Button
					className="wp-block-social-link-anchor"
					ref={ setPopoverAnchor }
					onClick={ () => setShowPopover( true ) }
				>
					<IconComponent />
					<span
						className={ classNames( 'wp-block-social-link-label', {
							'screen-reader-text': ! showLabels,
						} ) }
					>
						{ socialLinkLabel }
					</span>
					{ isSelected && showPopover && (
						<SocialLinkURLPopover
							url={ url }
							setAttributes={ setAttributes }
							onClose={ setShowPopover }
							popoverAnchor={ popoverAnchor }
							clientId={ clientId }
						/>
					) }
				</Button>
			</li>
		</>
	);
};

export default SocialLinkEdit;
