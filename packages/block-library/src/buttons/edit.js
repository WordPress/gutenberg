/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
	__experimentalBlock as Block,
	InnerBlocks,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];
const ORIENTATION_OPTIONS = [
	{ label: __( 'Horizontal' ), value: 'horizontal' },
	{
		label: __( 'Vertical' ),
		value: 'vertical',
	},
];

// Inside buttons block alignment options are not supported.
const alignmentHooksSetting = {
	isEmbedButton: true,
};

function ButtonsEdit( { attributes: { orientation }, setAttributes } ) {
	return (
		<Block.div
			className={ classnames( {
				'is-vertical': orientation === 'vertical',
			} ) }
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
						label={ __( 'Orientation' ) }
						selected={ orientation }
						options={ ORIENTATION_OPTIONS }
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
