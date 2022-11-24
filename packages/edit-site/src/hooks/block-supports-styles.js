/**
 * External dependencies
 */
import { set } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useContext, useState } from '@wordpress/element';
import {
	ColorEdit,
	TypographyPanel,
	BorderPanel,
	DimensionsPanel,
	useDisplayBlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import { Button, PanelBody } from '@wordpress/components';
import { getCSSVarFromStyleValue } from '@wordpress/style-engine';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GlobalStylesContext } from '../components/global-styles/context';

export const withEditBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name } = props;
		const [ shouldPushToGlobalStyles, setShouldPushToGlobalStyles ] =
			useState( false );
		const { setUserConfig } = useContext( GlobalStylesContext );

		const shouldDisplayControls = useDisplayBlockControls();
		const blockSupportControlProps = {
			...props,
			setBlockGlobalStyles: ( path, newValue ) => {
				if ( ! shouldPushToGlobalStyles ) {
					return;
				}
				const fullPath = `styles.blocks.${ name }.${ path }`;
				setUserConfig( ( currentConfig ) => {
					// Deep clone `currentConfig` to avoid mutating it later.
					const newUserConfig = JSON.parse(
						JSON.stringify( currentConfig )
					);
					set( newUserConfig, fullPath, getCSSVarFromStyleValue( newValue ) );
					return newUserConfig;
				} );
			},
		};

		return (
			<>
				{ shouldDisplayControls && (
					<>
						<ColorEdit { ...blockSupportControlProps } />
						<TypographyPanel { ...blockSupportControlProps } />
						<BorderPanel { ...blockSupportControlProps } />
						<DimensionsPanel { ...blockSupportControlProps } />
						<InspectorControls __experimentalGroup="advanced">
							<PanelBody
								title={ __( 'Apply styles to all blocks' ) }
							>
								<Button
									variant={
										! shouldPushToGlobalStyles
											? 'primary'
											: 'secondary'
									}
									isPressed={ shouldPushToGlobalStyles }
									onClick={ () => {
										setShouldPushToGlobalStyles(
											! shouldPushToGlobalStyles
										);
									} }
								>
									{ shouldPushToGlobalStyles ? __( 'Do not apply changes' ) : __( 'Apply changes' ) }
								</Button>
								<p>
									{ __(
										"When activated, all changes to this block's styles will be applied to all blocks of this type. Note that only typography, dimensions, color and border styles will be copied."
									) }
								</p>
							</PanelBody>
						</InspectorControls>
					</>
				) }
				<BlockEdit { ...props } />
			</>
		);
	},
	'withEditBlockControls'
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/block-supports-styles',
	withEditBlockControls
);
