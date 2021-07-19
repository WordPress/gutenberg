/**
 * WordPress dependencies
 */
import { ContrastChecker, PanelColorSettings } from '@wordpress/block-editor';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const SecondaryColorControls = ( {
	sections,
	isStripedStyle,
	tableProps: {
		secondaryBackgroundColor,
		setSecondaryBackgroundColor,
		secondaryTextColor,
		setSecondaryTextColor,
		headerBackgroundColor,
		setHeaderBackgroundColor,
		headerTextColor,
		setHeaderTextColor,
		footerBackgroundColor,
		setFooterBackgroundColor,
		footerTextColor,
		setFooterTextColor,
	},
} ) => {
	const activeColors = [];
	const contrastCheckerConfigs = [];

	// Color options are only included as required to reduce clutter in the
	// inspector controls sidebar. Contrast checkers are setup for each
	// background and text color pairing.

	if ( sections.includes( 'head' ) ) {
		activeColors.push(
			{
				value: headerTextColor.color,
				onChange: setHeaderTextColor,
				label: __( 'Header text color' ),
			},
			{
				value: headerBackgroundColor.color,
				onChange: setHeaderBackgroundColor,
				label: __( 'Header background color' ),
			}
		);
		contrastCheckerConfigs.push( {
			textColor: headerTextColor?.color,
			backgroundColor: headerBackgroundColor?.color,
			isLargeText: false,
			id: 'header-contrast-checker',
		} );
	}

	if ( isStripedStyle ) {
		activeColors.push(
			{
				value: secondaryTextColor.color,
				onChange: setSecondaryTextColor,
				label: __( 'Striped text color' ),
			},
			{
				value: secondaryBackgroundColor.color,
				onChange: setSecondaryBackgroundColor,
				label: __( 'Striped background color' ),
			}
		);
		contrastCheckerConfigs.push( {
			textColor: secondaryTextColor?.color,
			backgroundColor: secondaryBackgroundColor?.color,
			isLargeText: false,
			id: 'striped-contrast-checker',
		} );
	}

	if ( sections.includes( 'foot' ) ) {
		activeColors.push(
			{
				value: footerTextColor.color,
				onChange: setFooterTextColor,
				label: __( 'Footer text color' ),
			},
			{
				value: footerBackgroundColor.color,
				onChange: setFooterBackgroundColor,
				label: __( 'Footer background color' ),
			}
		);
		contrastCheckerConfigs.push( {
			textColor: footerTextColor?.color,
			backgroundColor: footerBackgroundColor?.color,
			isLargeText: false,
			id: 'footer-contrast-checker',
		} );
	}

	// Don't display color controls for Native or if there aren't any needed.
	if ( Platform.OS !== 'web' || ! activeColors.length ) {
		return null;
	}

	const contrastCheckers = contrastCheckerConfigs.map( ( config ) => (
		<ContrastChecker key={ config.id } { ...config } />
	) );

	return (
		<PanelColorSettings
			title={ __( 'Secondary Colors' ) }
			colorSettings={ activeColors }
			initialOpen={ false }
		>
			{ contrastCheckers }
		</PanelColorSettings>
	);
};

export default SecondaryColorControls;
