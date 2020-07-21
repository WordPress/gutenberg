/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	__experimentalLineHeightControl as LineHeightControl,
	FontSizePicker,
	PanelColorSettings,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import {
	FONT_SIZE,
	LINE_HEIGHT,
	TEXT_COLOR,
	BACKGROUND_COLOR,
	LINK_COLOR,
} from '../editor/utils';

export default () => {
	const { getProperty, setProperty, blockData } = useGlobalStylesContext();
	return (
		<>
			{ Object.keys( blockData )
				.map( ( selector ) => {
					const { supports, name } = blockData[ selector ];
					const panels = [];

					if ( 'global' === name ) {
						return null;
					}

					if ( supports.includes( FONT_SIZE ) ) {
						panels.push(
							<FontSizePicker
								value={ getProperty(
									selector,
									'typography',
									'fontSize',
									'px'
								) }
								onChange={ ( value ) =>
									setProperty(
										selector,
										'typography',
										'fontSize',
										value,
										'px'
									)
								}
							/>
						);
					}

					if ( supports.includes( LINE_HEIGHT ) ) {
						panels.push(
							<LineHeightControl
								value={ getProperty(
									selector,
									'typography',
									'lineHeight'
								) }
								onChange={ ( value ) =>
									setProperty(
										selector,
										'typography',
										'lineHeight',
										value
									)
								}
							/>
						);
					}

					const settings = [];
					if (
						supports.includes( TEXT_COLOR ) &&
						supports.includes( BACKGROUND_COLOR )
					) {
						settings.push( {
							value: getProperty( selector, 'color', 'text' ),
							onChange: ( value ) =>
								setProperty( selector, 'color', 'text', value ),
							label: __( 'Text color' ),
						} );
						settings.push( {
							value: getProperty(
								selector,
								'color',
								'background'
							),
							onChange: ( value ) =>
								setProperty(
									selector,
									'color',
									'background',
									value
								),
							label: __( 'Background color' ),
						} );
					}

					// TODO: do gradients

					if ( supports.includes( LINK_COLOR ) ) {
						settings.push( {
							value: getProperty( selector, 'color', 'link' ),
							onChange: ( value ) =>
								setProperty( selector, 'color', 'link', value ),
							label: __( 'Link color' ),
						} );
					}

					if ( settings.length > 0 ) {
						panels.push(
							<PanelColorSettings
								title={ __( 'Color' ) }
								colorSettings={ settings }
							/>
						);
					}

					return panels.length > 0 ? (
						<PanelBody title={ selector } initialOpen={ false }>
							{ panels }
						</PanelBody>
					) : null;
				} )
				.filter( Boolean ) }
		</>
	);
};
