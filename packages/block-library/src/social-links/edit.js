/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */

import { Fragment } from '@wordpress/element';

import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	CustomSelectControl,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

// The default_option is used for the CustomSelectControl if no value is found.
// This prevents deprecation issues for social links without a default size set.
const defaultOption = {
	name: __( 'Normal' ),
	key: 'has-normal-icon-size',
	style: { fontSize: '100%' },
};

const iconOptions = [
	{
		key: 'has-small-icon-size',
		name: __( 'Small' ),
		style: { fontSize: '75%' },
	},
	defaultOption,
	{
		name: __( 'Large' ),
		key: 'has-large-icon-size',
		style: { fontSize: '150%' },
	},
	{
		name: __( 'Huge' ),
		key: 'has-huge-icon-size',
		style: { fontSize: '200%' },
	},
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

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={ __( 'Icon size' ) }>
					<CustomSelectControl
						className={ 'components-icon-size-picker__select' }
						label={ __( 'Icon size' ) }
						options={ iconOptions }
						value={
							iconOptions.find(
								( option ) => option.key === iconSize
							) || defaultOption
						}
						onChange={ ( { selectedItem } ) => {
							setAttributes( { iconSize: selectedItem.key } );
						} }
					/>
				</PanelBody>
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
