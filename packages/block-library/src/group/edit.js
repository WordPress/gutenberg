/**
 * External dependencies
 */
import classnames from 'classnames';
import tinycolor from 'tinycolor2';

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

function hasCustomBackgroundColor( backgroundColor ) {
	return ! backgroundColor.name && ! backgroundColor.class;
}

function hasCustomTextColor( textColor ) {
	return textColor && tinycolor( textColor.color ).getFormat() === 'hex';
}

function getTextColor( textColor, backgroundColor ) {
	if ( ! hasCustomTextColor( textColor ) ) {
		return tinycolor( backgroundColor.color ).isDark() ? 'white' : 'black';
	}
	return textColor ? textColor.color : null;
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

	const colorSettings = [ {
		value: backgroundColor.color,
		onChange: setBackgroundColor,
		label: __( 'Background Color' ),
	} ];

	if ( hasCustomBackgroundColor( backgroundColor ) ) {
		const textContrastColor = getTextColor( textColor, backgroundColor );
		setTextColor( textContrastColor );

		colorSettings.push( {
			value: textContrastColor,
			onChange: setTextColor,
			label: __( 'Text Color' ),
			colors: null,
		} );
	} else {
		setTextColor( null );
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
