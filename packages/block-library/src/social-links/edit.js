/**
 * WordPress dependencies
 */
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	ContrastChecker,
	InspectorControls,
	PanelColorSettings,
	withColors,
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { Fragment, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

export function SocialLinksEdit( props ) {
	const {
		attributes: { className, openInNewTab },
		setAttributes,
		backgroundColor,
		setBackgroundColor,
		iconColor,
		setIconColor,
	} = props;

	const SocialPlaceholder = (
		<div className="wp-block-social-links__social-placeholder">
			<div className="wp-block-social-link wp-social-link-facebook"></div>
			<div className="wp-block-social-link wp-social-link-twitter"></div>
			<div className="wp-block-social-link wp-social-link-instagram"></div>
		</div>
	);

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		orientation: 'horizontal',
		placeholder: SocialPlaceholder,
		templateLock: false,
		__experimentalAppenderTagName: 'li',
	} );
	const logosOnly = className.indexOf( 'is-style-logos-only' ) >= 0;

	useEffect( () => {
		if ( logosOnly ) {
			setBackgroundColor();
		}
	}, [ logosOnly, setBackgroundColor ] );

	return (
		<Fragment>
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
				<PanelColorSettings
					title={ __( 'Color settings' ) }
					colorSettings={ [
						{
							value: iconColor.color,
							onChange: setIconColor,
							label: __( 'Icon color' ),
						},
						! logosOnly && {
							value: backgroundColor.color,
							onChange: setBackgroundColor,
							label: __( 'Background color' ),
						},
					] }
				/>
				{ ! logosOnly && (
					<ContrastChecker
						{ ...{
							textColor: iconColor.color,
							backgroundColor: backgroundColor.color,
						} }
						isLargeText={ false }
					/>
				) }
			</InspectorControls>
			<ul { ...innerBlocksProps } />
		</Fragment>
	);
}

export default withColors( 'backgroundColor', { iconColor: 'color' } )(
	SocialLinksEdit
);
