/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import {
	PanelBody,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { cleanEmptyObject } from './utils';

export const BORDER_SUPPORT_KEY = '__experimentalEnableCustomBorder';

export function BorderEdit( props ) {
	const isDisabled = useIsBorderDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	return Platform.select( {
		web: (
			<InspectorControls>
				<PanelBody title={ __( 'Border' ) }>
					<BorderWidthControls { ...props } />
				</PanelBody>
			</InspectorControls>
		),
		native: null,
	} );
}

function BorderWidthControls( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			border: {
				width: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const value = parseFloat( style?.border?.width || 0 );

	return (
		<UnitControl
			label={ __( 'Width' ) }
			max={ 50 }
			min={ 0 }
			onChange={ onChange }
			style={ { maxWidth: 80 } }
			unit="px"
			units={ [ { value: 'px', label: 'px' } ] }
			value={ value }
		/>
	);
}

export const borderStyleMappings = {
	'--wp--style--border--width': [ 'border', 'width' ],
};

/**
 * Custom hook that checks if border settings have been disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether setting is disabled.
 */
function useIsBorderDisabled( { name: blockName } = {} ) {
	const isDisabled = useSelect( ( select ) => {
		const editorSettings = select( 'core/block-editor' ).getSettings();
		return ! editorSettings[ BORDER_SUPPORT_KEY ];
	} );

	return ! hasBlockSupport( blockName, BORDER_SUPPORT_KEY ) || isDisabled;
}
