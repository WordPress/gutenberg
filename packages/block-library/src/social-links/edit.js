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
	Dropdown,
	MenuGroup,
	MenuItem,
	PanelBody,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

const sizeOptions = [
	{ name: __( 'Small' ), value: 'has-small-icon-size' },
	{ name: __( 'Normal' ), value: 'has-normal-icon-size' },
	{ name: __( 'Large' ), value: 'has-large-icon-size' },
	{ name: __( 'Huge' ), value: 'has-huge-icon-size' },
];

export function SocialLinksEdit( props ) {
	const {
		attributes: { iconSize, openInNewTab },
		setAttributes,
	} = props;

	const SocialPlaceholder = (
		<div className="wp-block-social-links__social-placeholder">
			<div className="wp-block-social-link wp-social-link-facebook"></div>
			<div className="wp-block-social-link wp-social-link-twitter"></div>
			<div className="wp-block-social-link wp-social-link-instagram"></div>
		</div>
	);

	const className = classNames( iconSize );
	const blockProps = useBlockProps( { className } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		orientation: 'horizontal',
		placeholder: SocialPlaceholder,
		templateLock: false,
		__experimentalAppenderTagName: 'li',
	} );

	const openOnArrowDown = ( event ) => {
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			event.target.click();
		}
	};
	return (
		<Fragment>
			<BlockControls>
				<Dropdown
					className={ 'icon-size-picker__dropdown' }
					contentClassName={ 'icon-size-picker__dropdowncontent' }
					popoverProps={ { position: 'bottom right' } }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<ToolbarGroup>
							<ToolbarButton
								onClick={ onToggle }
								onKeyDown={ openOnArrowDown }
								aria-expanded={ isOpen }
								aria-haspopup="true"
							>
								{ __( 'Size' ) }
							</ToolbarButton>
						</ToolbarGroup>
					) }
					renderContent={ () => (
						<MenuGroup label={ __( 'Icon size' ) }>
							{ sizeOptions.map( ( entry ) => {
								return (
									<MenuItem
										icon={
											iconSize === entry.value && check
										}
										isSelected={ iconSize === entry.value }
										key={ entry.value }
										onClick={ () =>
											setAttributes( {
												iconSize: entry.value,
											} )
										}
										role="menuitemradio"
									>
										{ entry.name }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }
				/>
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
