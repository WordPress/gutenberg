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

const FONT_SIZE = 'font-size';
const LINK_COLOR = '--wp--style--color--link';
const BACKGROUND_COLOR = 'background-color';

export default () => {
	const {
		globalContext: { supports },
		getProperty,
		setProperty,
	} = useGlobalStylesContext();

	const panels = [];
	const colorSettings = [];

	if ( supports.includes( FONT_SIZE ) ) {
		panels.push(
			<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
				<FontSizePicker
					value={ getProperty(
						'global',
						'typography',
						'fontSize',
						'px'
					) }
					onChange={ ( value ) =>
						setProperty(
							'global',
							'typography',
							'fontSize',
							value,
							'px'
						)
					}
				/>
			</PanelBody>
		);
	}

	if ( supports.includes( BACKGROUND_COLOR ) ) {
		colorSettings.push( {
			value: getProperty( 'global', 'color', 'background' ),
			onChange: ( value ) =>
				setProperty( 'global', 'color', 'background', value ),
			label: __( 'Background color' ),
		} );
	}

	if ( supports.includes( LINK_COLOR ) ) {
		colorSettings.push( {
			value: getProperty( 'global', 'color', 'link' ),
			onChange: ( value ) =>
				setProperty( 'global', 'color', 'link', value ),
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
