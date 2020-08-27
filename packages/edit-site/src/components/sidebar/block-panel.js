/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { PanelColorSettings } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { BACKGROUND_COLOR, LINK_COLOR, TEXT_COLOR } from '../editor/utils';
import TypographyPanel from './typography-panel';

export default ( { getProperty, setProperty, contexts } ) => {
	return (
		<>
			{ Object.keys( contexts )
				.map( ( key ) => {
					const { supports, name, selector } = contexts[ key ];
					const panels = [];

					panels.push(
						<TypographyPanel
							context={ { supports, name: key } }
							getProperty={ getProperty }
							setProperty={ setProperty }
						/>
					);

					const settings = [];
					if (
						supports.includes( TEXT_COLOR ) &&
						supports.includes( BACKGROUND_COLOR )
					) {
						settings.push( {
							value: getProperty( key, 'color', 'text' ),
							onChange: ( value ) =>
								setProperty( key, 'color', 'text', value ),
							label: __( 'Text color' ),
						} );
						settings.push( {
							value: getProperty( key, 'color', 'background' ),
							onChange: ( value ) =>
								setProperty(
									key,
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
							value: getProperty( key, 'color', 'link' ),
							onChange: ( value ) =>
								setProperty( key, 'color', 'link', value ),
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
