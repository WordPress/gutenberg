/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	__experimentalBlock as Block,
	__experimentalLinkControl as LinkControl,
} from '@wordpress/block-editor';
import { Fragment, useState } from '@wordpress/element';
import {
	Button,
	PanelBody,
	PanelRow,
	TextControl,
	ToggleControl,
	Popover,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getIconBySite, getNameBySite } from './social-list';

const NEW_TAB_REL = 'noreferrer noopener';

const SocialLinkEdit = ( { attributes, setAttributes, isSelected } ) => {
	const { url, service, label, rel, linkTarget } = attributes;
	const [ isURLPickerOpen, setIsURLPickerOpen ] = useState( false );
	const classes = classNames( 'wp-social-link', 'wp-social-link-' + service, {
		'wp-social-link__is-incomplete': ! url,
	} );

	const IconComponent = getIconBySite( service );
	const socialLinkName = getNameBySite( service );

	const onToggleOpenInNewTab = ( value ) => {
		const newLinkTarget = value ? '_blank' : undefined;

		let updatedRel = rel;
		if ( newLinkTarget && ! rel ) {
			updatedRel = NEW_TAB_REL;
		} else if ( ! newLinkTarget && rel === NEW_TAB_REL ) {
			updatedRel = undefined;
		}

		setAttributes( {
			linkTarget: newLinkTarget,
			rel: updatedRel,
		} );
	};

	const onSetLinkRel = ( value ) => {
		setAttributes( { rel: value } );
	};

	const opensInNewTab = linkTarget === '_blank';

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
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open in new tab' ) }
						onChange={ onToggleOpenInNewTab }
						checked={ opensInNewTab }
					/>
					<TextControl
						label={ __( 'Link rel' ) }
						value={ rel || '' }
						onChange={ onSetLinkRel }
					/>
				</PanelBody>
			</InspectorControls>
			<Block.li className={ classes }>
				<Button onClick={ () => setIsURLPickerOpen( true ) }>
					<IconComponent />
					{ isSelected && isURLPickerOpen && (
						<Popover
							position="bottom center"
							onClose={ () => setIsURLPickerOpen( false ) }
						>
							<LinkControl
								className="wp-block-navigation-link__inline-link-input"
								value={ { url, opensInNewTab } }
								onChange={ ( {
									url: newURL = '',
									opensInNewTab: newOpensInNewTab,
								} ) => {
									setAttributes( { url: newURL } );

									if ( opensInNewTab !== newOpensInNewTab ) {
										onToggleOpenInNewTab(
											newOpensInNewTab
										);
									}
								} }
							/>
						</Popover>
					) }
				</Button>
			</Block.li>
		</Fragment>
	);
};

export default SocialLinkEdit;
