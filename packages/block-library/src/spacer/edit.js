/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { BaseControl, PanelBody, ResizableBox } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';

const SpacerEdit = ( { attributes, isSelected, setAttributes, toggleSelection, instanceId } ) => {
	const { height } = attributes;
	const id = `block-spacer-height-input-${ instanceId }`;

	return (
		<Fragment>
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
					setAttributes( {
						height: parseInt( height + delta.height, 10 ),
					} );
					toggleSelection( true );
				} }
				onResizeStart={ () => {
					toggleSelection( false );
				} }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Spacer Settings' ) }>
					<BaseControl label={ __( 'Height in pixels' ) } id={ id }>
						<input
							type="number"
							id={ id }
							onChange={ ( event ) => {
								setAttributes( {
									height: parseInt( event.target.value, 10 ),
								} );
							} }
							value={ height }
							min="20"
							step="10"
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
};

export default withInstanceId( SpacerEdit );
