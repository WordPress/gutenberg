/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, PanelBody, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	useGlobalStylesContext,
	useGlobalStylesReset,
} from '../editor/global-styles-provider';
import DefaultSidebar from './default-sidebar';
import { GLOBAL_CONTEXT } from '../editor/utils';
import TypographyPanel from './typography-panel';
import ColorPanel from './color-panel';

export default ( { identifier, title, icon, closeLabel } ) => {
	const {
		contexts,
		getStyleProperty,
		setStyleProperty,
		getSetting,
		setSetting,
	} = useGlobalStylesContext();
	const [ canRestart, onReset ] = useGlobalStylesReset();

	if ( typeof contexts !== 'object' || ! contexts?.[ GLOBAL_CONTEXT ] ) {
		// No sidebar is shown.
		return null;
	}

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier={ identifier }
			title={ title }
			icon={ icon }
			closeLabel={ closeLabel }
			header={
				<>
					<strong>{ title }</strong>
					<Button
						className="edit-site-global-styles-sidebar__reset-button"
						isSmall
						isTertiary
						disabled={ ! canRestart }
						onClick={ onReset }
					>
						{ __( 'Reset to defaults' ) }
					</Button>
				</>
			}
		>
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
								// Protect against blocks that aren't registered
								// eg: widget-area
								if ( blockType === undefined ) {
									return blockType;
								}

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
												getSetting={ getSetting }
												setSetting={ setSetting }
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
							getSetting={ getSetting }
							setSetting={ setSetting }
						/>,
					].filter( Boolean );
				} }
			</TabPanel>
		</DefaultSidebar>
	);
};
