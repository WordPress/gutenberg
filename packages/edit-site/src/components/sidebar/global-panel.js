/**
 * WordPress dependencies
 */
import { FontSizePicker, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import {
	GLOBAL_CONTEXT,
	FONT_SIZE,
	BACKGROUND_COLOR,
	LINK_COLOR,
	fromPx,
	toPx,
} from '../editor/utils';

export default () => {
	const { contexts, getProperty, setProperty } = useGlobalStylesContext();

	const { supports } = contexts[ GLOBAL_CONTEXT ];
	const panels = [];
	const colorSettings = [];

	if ( supports.includes( FONT_SIZE ) ) {
		panels.push(
			<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
				<FontSizePicker
					value={ fromPx(
						getProperty( GLOBAL_CONTEXT, 'typography', 'fontSize' )
					) }
					onChange={ ( value ) =>
						setProperty(
							GLOBAL_CONTEXT,
							'typography',
							'fontSize',
							toPx( value )
						)
					}
				/>
			</PanelBody>
		);
	}

	if ( supports.includes( BACKGROUND_COLOR ) ) {
		colorSettings.push( {
			value: getProperty( GLOBAL_CONTEXT, 'color', 'background' ),
			onChange: ( value ) =>
				setProperty( GLOBAL_CONTEXT, 'color', 'background', value ),
			label: __( 'Background color' ),
		} );
	}

	if ( supports.includes( LINK_COLOR ) ) {
		colorSettings.push( {
			value: getProperty( GLOBAL_CONTEXT, 'color', 'link' ),
			onChange: ( value ) =>
				setProperty( GLOBAL_CONTEXT, 'color', 'link', value ),
			label: __( 'Link color' ),
		} );
	}

	if ( colorSettings.length > 0 ) {
		panels.push(
			<PanelColorSettings
				title={ __( 'Color' ) }
				colorSettings={ colorSettings }
			/>
		);
	}

	return panels;
};
