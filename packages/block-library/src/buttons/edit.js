/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
	InnerBlocks,
	__experimentalBlock as Block,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, RadioControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

// Inside buttons block alignment options are not supported.
const alignmentHooksSetting = {
	isEmbedButton: true,
};

function ButtonsEdit( { attributes, setAttributes } ) {
	const { orientation } = attributes;

	return (
		<Block.div
			className={ `${
				orientation === 'vertical' ? 'is-direction-vertical' : ''
			}` }
		>
			<AlignmentHookSettingsProvider value={ alignmentHooksSetting }>
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					template={ BUTTONS_TEMPLATE }
					__experimentalMoverDirection={ orientation }
				/>
			</AlignmentHookSettingsProvider>
			<InspectorControls>
				<PanelBody title={ __( 'Buttons Settings' ) }>
					<RadioControl
						label={ __( 'Direction' ) }
						selected={ orientation }
						options={ [
							{ label: __( 'Horizontal' ), value: 'horizontal' },
							{
								label: __( 'Vertical' ),
								value: 'vertical',
							},
						] }
						onChange={ ( value ) =>
							setAttributes( {
								orientation: value,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
		</Block.div>
	);
}

export default ButtonsEdit;
