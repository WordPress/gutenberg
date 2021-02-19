/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, ResizableBox, RangeControl } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { View } from '@wordpress/primitives';

const MIN_SPACER_HEIGHT = 1;
const MAX_SPACER_HEIGHT = 500;

const MIN_SPACER_WIDTH = 1;
const MAX_SPACER_WIDTH = 500;

const SpacerEdit = ( {
	attributes,
	isSelected,
	setAttributes,
	onResizeStart,
	onResizeStop,
} ) => {
	const [ isResizing, setIsResizing ] = useState( false );
	const { height, width } = attributes;
	const updateHeight = ( value ) => {
		setAttributes( {
			height: value,
		} );
	};
	const updateWidth = ( value ) => {
		setAttributes( {
			width: value,
		} );
	};

	const handleOnResizeStart = ( ...args ) => {
		onResizeStart( ...args );
		setIsResizing( true );
	};

	const handleOnResizeStop = ( event, direction, elt, delta ) => {
		onResizeStop();
		const spacerHeight = Math.min(
			parseInt( height + delta.height, 10 ),
			MAX_SPACER_HEIGHT
		);
		const spacerWidth = Math.min(
			parseInt( width + delta.width, 10 ),
			MAX_SPACER_WIDTH
		);
		updateHeight( spacerHeight );
		updateWidth( spacerWidth );
		setIsResizing( false );
	};

	return (
		<>
			<View { ...useBlockProps() }>
				<ResizableBox
					className={ classnames(
						'block-library-spacer__resize-container',
						{
							'is-selected': isSelected,
						}
					) }
					size={ {
						height,
						width,
					} }
					minHeight={ MIN_SPACER_HEIGHT }
					minWidth={ MIN_SPACER_WIDTH }
					enable={ {
						top: false,
						right: true,
						bottom: true,
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					onResizeStart={ handleOnResizeStart }
					onResizeStop={ handleOnResizeStop }
					showHandle={ isSelected }
					__experimentalShowTooltip={ true }
					__experimentalTooltipProps={ {
						axis: 'y',
						position: 'bottom',
						isVisible: isResizing,
					} }
				/>
			</View>
			<InspectorControls>
				<PanelBody title={ __( 'Spacer settings' ) }>
					<RangeControl
						label={ __( 'Height in pixels' ) }
						min={ MIN_SPACER_HEIGHT }
						max={ Math.max( MAX_SPACER_HEIGHT, height ) }
						value={ height }
						onChange={ updateHeight }
					/>
					<RangeControl
						label={ __( 'Width in pixels' ) }
						min={ MIN_SPACER_WIDTH }
						max={ Math.max( MAX_SPACER_WIDTH, width ) }
						value={ width }
						onChange={ updateWidth }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default compose( [
	withDispatch( ( dispatch ) => {
		const { toggleSelection } = dispatch( blockEditorStore );

		return {
			onResizeStart: () => toggleSelection( false ),
			onResizeStop: () => toggleSelection( true ),
		};
	} ),
	withInstanceId,
] )( SpacerEdit );
