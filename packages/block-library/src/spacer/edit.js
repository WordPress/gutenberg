/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { BaseControl, Box, PanelBody, ResizableBox } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';

const SpacerEdit = ( { attributes, isSelected, setAttributes, instanceId } ) => {
	const { height } = attributes;
	const id = `block-spacer-height-input-${ instanceId }`;
	const [ inputHeightValue, setInputHeightValue ] = useState( height );

	return (
		<>
			<Box
				width={ 1 / 2 }
				justifyContent="flex-start"
				alignContent="center"
				color="#fff"
				bg="tomato">
				Tomato
				<Box
					bg="blue">
					Blue
				</Box>
				<Box
					bg="green">
					Green
				</Box>
			</Box>
			<ResizableBox
				className={ classnames(
					'block-library-spacer__resize-container',
					{ 'is-selected': isSelected },
				) }
				size={ {
					height,
				} }
				minHeight="20"
				enable={ {
					top: false,
					right: false,
					bottom: true,
					left: false,
					topRight: false,
					bottomRight: false,
					bottomLeft: false,
					topLeft: false,
				} }
				onResizeStop={ ( event, direction, elt, delta ) => {
					const spacerHeight = parseInt( height + delta.height, 10 );
					setAttributes( {
						height: spacerHeight,
					} );
					setInputHeightValue( spacerHeight );
				} }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Spacer Settings' ) }>
					<BaseControl label={ __( 'Height in pixels' ) } id={ id }>
						<input
							type="number"
							id={ id }
							onChange={ ( event ) => {
								let spacerHeight = parseInt( event.target.value, 10 );
								setInputHeightValue( spacerHeight );
								if ( isNaN( spacerHeight ) ) {
									// Set spacer height to default size and input box to empty string
									setInputHeightValue( '' );
									spacerHeight = 100;
								} else if ( spacerHeight < 20 ) {
									// Set spacer height to minimum size
									spacerHeight = 20;
								}
								setAttributes( {
									height: spacerHeight,
								} );
							} }
							value={ inputHeightValue }
							min="20"
							step="10"
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default withInstanceId( SpacerEdit );
