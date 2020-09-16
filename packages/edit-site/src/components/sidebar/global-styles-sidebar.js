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
	const {
		contexts,
		getStyleProperty,
		setStyleProperty,
	} = useGlobalStylesContext();

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
									blockName,
								} = contexts[ name ];

								/*
								 * We use the block's name as the panel title.
								 *
								 * Some blocks (eg: core/heading) can represent different
								 * contexts (eg: core/heading/h1, core/heading/h2).
								 * For those, we attach the selector (h1) after the block's name.
								 *
								 * The title can't be accessed in the server,
								 * as it's translatable and the block.json doesn't
								 * have it yet.
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
												getStyleProperty={
													getStyleProperty
												}
												setStyleProperty={
													setStyleProperty
												}
											/>,
											<ColorPanel
												key={ 'color-panel-' + name }
												context={ {
													supports,
													name,
												} }
												getStyleProperty={
													getStyleProperty
												}
												setStyleProperty={
													setStyleProperty
												}
											/>,
										].filter( Boolean ) }
									</PanelBody>
								);
							} )
							.filter( Boolean );
					}

					/* Global Context */
					const { supports, blockName } = contexts[ GLOBAL_CONTEXT ];
					return [
						<TypographyPanel
							key={ 'typography-panel-' + blockName }
							context={ {
								supports,
								name: blockName,
							} }
							getStyleProperty={ getStyleProperty }
							setStyleProperty={ setStyleProperty }
						/>,
						<ColorPanel
							key={ 'color-panel-' + blockName }
							context={ {
								supports,
								name: blockName,
							} }
							getStyleProperty={ getStyleProperty }
							setStyleProperty={ setStyleProperty }
						/>,
					].filter( Boolean );
				} }
			</TabPanel>
		</DefaultSidebar>
	);
};
