/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
	withColors,
} from '@wordpress/block-editor';

function getTextContrast( hexcolor ) {
	// If a leading # is provided, remove it
	if ( hexcolor.slice( 0, 1 ) === '#' ) {
		hexcolor = hexcolor.slice( 1 );
	}

	// If a three-character hexcode, make six-character
	if ( hexcolor.length === 3 ) {
		hexcolor = hexcolor.split( '' ).map( function( hex ) {
			return hex + hex;
		} ).join( '' );
	}

	// Convert to RGB value
	const r = parseInt( hexcolor.substr( 0, 2 ), 16 );
	const g = parseInt( hexcolor.substr( 2, 2 ), 16 );
	const b = parseInt( hexcolor.substr( 4, 2 ), 16 );

	// Get YIQ ratio
	const yiq = ( ( r * 299 ) + ( g * 587 ) + ( b * 114 ) ) / 1000;

	// Check contrast
	return ( yiq >= 128 ) ? 'black' : 'white';
}

function GroupEdit( {
	className,
	setBackgroundColor,
	backgroundColor,
	setTextColor,
	textColor,
	hasInnerBlocks,
} ) {
	const styles = {
		backgroundColor: backgroundColor.color,
		color: textColor.color,
	};

	const classes = classnames( className, backgroundColor.class, {
		'has-background': !! backgroundColor.color,
	} );

	const backgroundColorSettings = {
		value: backgroundColor.color,
		onChange: setBackgroundColor,
		label: __( 'Background Color' ),
	};

	let colorSettings;

	if ( ! backgroundColor.name && ! backgroundColor.class ) {
		const textContrastColor = getTextContrast( backgroundColor.color );
		setTextColor( textContrastColor );
		colorSettings = [
			{
				value: textContrastColor,
				onChange: setTextColor,
				label: __( 'Text Color' ),
				colors: null,
			},
			backgroundColorSettings,
		];
	} else {
		setTextColor( null );
		colorSettings = [ backgroundColorSettings ];
	}

	return (
		<>
			<InspectorControls>
				<PanelColorSettings
					title={ __( 'Color Settings' ) }
					colorSettings={ colorSettings }
				/>
			</InspectorControls>
			<div className={ classes } style={ styles }>
				<div className="wp-block-group__inner-container">
					<InnerBlocks
						renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
					/>
				</div>
			</div>
		</>
	);
}

export default compose( [
	withColors( 'backgroundColor', 'textColor' ),
	withSelect( ( select, { clientId } ) => {
		const {
			getBlock,
		} = select( 'core/block-editor' );

		const block = getBlock( clientId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
] )( GroupEdit );
