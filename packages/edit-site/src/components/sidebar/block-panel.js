/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import TypographyPanel from './typography-panel';
import ColorPanel from './color-panel';

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

					panels.push(
						<ColorPanel
							context={ { supports, name: key } }
							getProperty={ getProperty }
							setProperty={ setProperty }
						/>
					);

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
