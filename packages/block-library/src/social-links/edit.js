/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */

import { Fragment } from '@wordpress/element';

import {
	BlockControls,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	PanelBody,
	ToggleControl,
	ToolbarItem,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

const sizeOptions = [
	{ name: __( 'Small' ), value: 'has-small-icon-size' },
	{ name: __( 'Normal' ), value: 'has-normal-icon-size' },
	{ name: __( 'Large' ), value: 'has-large-icon-size' },
	{ name: __( 'Huge' ), value: 'has-huge-icon-size' },
];

export function SocialLinksEdit( props ) {
	const {
		attributes: { size, openInNewTab },
		setAttributes,
	} = props;

	const SocialPlaceholder = (
		<div className="wp-block-social-links__social-placeholder">
			<div className="wp-social-link wp-social-link-facebook"></div>
			<div className="wp-social-link wp-social-link-twitter"></div>
			<div className="wp-social-link wp-social-link-instagram"></div>
		</div>
	);

	const className = classNames( size );
	const blockProps = useBlockProps( { className } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		orientation: 'horizontal',
		placeholder: SocialPlaceholder,
		templateLock: false,
		__experimentalAppenderTagName: 'li',
	} );

	const POPOVER_PROPS = {
		position: 'bottom right',
		isAlternate: true,
	};

	return (
		<Fragment>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarItem>
						{ () => (
							<DropdownMenu
								label={ __( 'Size' ) }
								text={ __( 'Size' ) }
								icon={ null }
								popoverProps={ POPOVER_PROPS }
							>
								{ ( onClose ) => (
									<MenuGroup>
										{ sizeOptions.map( ( entry ) => {
											return (
												<MenuItem
													icon={
														( size ===
															entry.value ||
															( ! size &&
																entry.value ===
																	'has-normal-icon-size' ) ) &&
														check
													}
													isSelected={
														size === entry.value
													}
													key={ entry.value }
													onClick={ () => {
														setAttributes( {
															size: entry.value,
														} );
													} }
													onClose={ onClose }
													role="menuitemradio"
												>
													{ entry.name }
												</MenuItem>
											);
										} ) }
									</MenuGroup>
								) }
							</DropdownMenu>
						) }
					</ToolbarItem>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open links in new tab' ) }
						checked={ openInNewTab }
						onChange={ () =>
							setAttributes( { openInNewTab: ! openInNewTab } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ul { ...innerBlocksProps } />
		</Fragment>
	);
}

export default SocialLinksEdit;
