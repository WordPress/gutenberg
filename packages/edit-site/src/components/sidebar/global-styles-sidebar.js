/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import DefaultSidebar from './default-sidebar';
import { GLOBAL_CONTEXT } from '../editor/utils';
import TypographyPanel from './typography-panel';
import ColorPanel from './color-panel';

export default ( { identifier, title, icon } ) => {
	const { contexts, getProperty, setProperty } = useGlobalStylesContext();

	if ( typeof contexts !== 'object' || ! contexts?.[ GLOBAL_CONTEXT ] ) {
		// No sidebar is shown.
		return null;
	}

	return (
		<DefaultSidebar identifier={ identifier } title={ title } icon={ icon }>
			<TabPanel
				tabs={ [
					{ name: 'global', title: __( 'Global' ) },
					{ name: 'block', title: __( 'By Block Type' ) },
				] }
			>
				{ ( tab ) => {
					/* Per Block Context */
					if ( 'block' === tab.name ) {
						return Object.keys(
							omit( contexts, [ GLOBAL_CONTEXT ] )
						)
							.map( ( name ) => {
								const {
									supports,
									selector,
									name: blockName,
								} = contexts[ name ];

								/*
								 * Some block (eg: core/heading) are split in different
								 * contexts (eg: core/heading/h1, core/heading/h2).
								 * Because each context maps to a different UI section
								 * in the sidebar we attach the selector (h1, h2)
								 * to the title for those blocks.
								 */
								const blockType = getBlockType( blockName );
								let panelTitle = blockType.title;
								if (
									'object' ===
									typeof blockType?.supports
										?.__experimentalSelector
								) {
									panelTitle += ` (${ selector })`;
								}

								return (
									<PanelBody
										key={ 'panel-' + name }
										title={ panelTitle }
										initialOpen={ false }
									>
										{ [
											<TypographyPanel
												key={
													'typography-panel-' + name
												}
												context={ {
													supports,
													name,
												} }
												getProperty={ getProperty }
												setProperty={ setProperty }
											/>,
											<ColorPanel
												key={ 'color-panel-' + name }
												context={ {
													supports,
													name,
												} }
												getProperty={ getProperty }
												setProperty={ setProperty }
											/>,
										].filter( Boolean ) }
									</PanelBody>
								);
							} )
							.filter( Boolean );
					}

					/* Global Context */
					const { supports, name } = contexts[ GLOBAL_CONTEXT ];
					return [
						<TypographyPanel
							key={ 'typography-panel-' + name }
							context={ {
								supports,
								name,
							} }
							getProperty={ getProperty }
							setProperty={ setProperty }
						/>,
						<ColorPanel
							key={ 'color-panel-' + name }
							context={ {
								supports,
								name,
							} }
							getProperty={ getProperty }
							setProperty={ setProperty }
						/>,
					].filter( Boolean );
				} }
			</TabPanel>
		</DefaultSidebar>
	);
};
