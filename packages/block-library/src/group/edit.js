/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
	withColors,
} from '@wordpress/block-editor';

const renderAppender = () => <InnerBlocks.ButtonBlockAppender />;

function GroupEdit( {
	className,
	setBackgroundColor,
	backgroundColor,
	hasInnerBlocks,
} ) {
	const styles = {
		backgroundColor: backgroundColor.color,
	};

	const classes = classnames( className, backgroundColor.class, {
		'has-background': !! backgroundColor.color,
	} );

	return (
		<Fragment>
			<InspectorControls>
				<PanelColorSettings
					title={ __( 'Color Settings' ) }
					colorSettings={ [
						{
							value: backgroundColor.color,
							onChange: setBackgroundColor,
							label: __( 'Background Color' ),
						},
					] }
				/>
			</InspectorControls>
			<div className={ classes } style={ styles }>
				<InnerBlocks
					renderAppender={ ! hasInnerBlocks && renderAppender }
				/>
			</div>
		</Fragment>
	);
}

export default compose( [
	withColors( 'backgroundColor' ),
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
