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
import { getBlockType } from '@wordpress/blocks';

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
				.map( ( context ) => {
					const { supports, name, selector } = blockData[ context ];
					const panels = [];

					/* This is shown in the global panel */
					if ( 'global' === name ) {
						return null;
					}

					if ( supports.includes( FONT_SIZE ) ) {
						panels.push(
							<FontSizePicker
								value={ getProperty(
									context,
									'typography',
									'fontSize',
									'px'
								) }
								onChange={ ( value ) =>
									setProperty(
										context,
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
									context,
									'typography',
									'lineHeight'
								) }
								onChange={ ( value ) =>
									setProperty(
										context,
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
							value: getProperty( context, 'color', 'text' ),
							onChange: ( value ) =>
								setProperty( context, 'color', 'text', value ),
							label: __( 'Text color' ),
						} );
						settings.push( {
							value: getProperty(
								context,
								'color',
								'background'
							),
							onChange: ( value ) =>
								setProperty(
									context,
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
							value: getProperty( context, 'color', 'link' ),
							onChange: ( value ) =>
								setProperty( context, 'color', 'link', value ),
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

					/*
					 * Some block (eg: core/heading) are split in different
					 * contexts (eg: core/heading/h1, core/heading/h2).
					 * Because each context maps to a different UI section
					 * in the sidebar we attach the selector (h1, h2)
					 * to the title for those blocks.
					 */
					const blockType = getBlockType( name );
					let panelTitle = blockType.title;
					if (
						'object' ===
						typeof blockType?.supports?.__experimentalSelector
					) {
						panelTitle += ` (${ selector })`;
					}

					return panels.length > 0 ? (
						<PanelBody title={ panelTitle } initialOpen={ false }>
							{ panels }
						</PanelBody>
					) : null;
				} )
				.filter( Boolean ) }
		</>
	);
};
