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
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';

export default () => {
	const { getProperty, setProperty } = useGlobalStylesContext();
	return (
		<>
			{ getBlockTypes()
				.map(
					( {
						name,
						title,
						supports: {
							__experimentalFontSize,
							__experimentalLineHeight,
							__experimentalColor,
						},
					} ) => {
						const panels = [];

						if ( 'core/heading' === name ) {
							//TODO: process heading as separate blocks
							return null;
						}

						if ( __experimentalFontSize ) {
							panels.push(
								<FontSizePicker
									value={ getProperty(
										name,
										'typography',
										'fontSize',
										'px'
									) }
									onChange={ ( value ) =>
										setProperty(
											name,
											'typography',
											'fontSize',
											value,
											'px'
										)
									}
								/>
							);
						}

						if ( __experimentalLineHeight ) {
							panels.push(
								<LineHeightControl
									value={ getProperty(
										name,
										'typography',
										'lineHeight'
									) }
									onChange={ ( value ) =>
										setProperty(
											name,
											'typography',
											'lineHeight',
											value
										)
									}
								/>
							);
						}

						const settings = [];
						if ( __experimentalColor ) {
							settings.push( {
								value: getProperty( name, 'color', 'text' ),
								onChange: ( value ) =>
									setProperty( name, 'color', 'text', value ),
								label: __( 'Text color' ),
							} );
							settings.push( {
								value: getProperty(
									name,
									'color',
									'background'
								),
								onChange: ( value ) =>
									setProperty(
										name,
										'color',
										'background',
										value
									),
								label: __( 'Background color' ),
							} );
						}

						if ( __experimentalColor?.gradients ) {
							// TODO: do gradients
						}

						if ( __experimentalColor?.linkColor ) {
							settings.push( {
								value: getProperty( name, 'color', 'link' ),
								onChange: ( value ) =>
									setProperty( name, 'color', 'link', value ),
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
							<PanelBody title={ title } initialOpen={ false }>
								{ panels }
							</PanelBody>
						) : null;
					}
				)
				.filter( Boolean ) }
		</>
	);
};
