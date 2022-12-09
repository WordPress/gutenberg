/**
 * External dependencies
 */
import { get, set } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorAdvancedControls } from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { __EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY } from '@wordpress/blocks';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels } from '../components/global-styles/hooks';
import { GlobalStylesContext } from '../components/global-styles/context';

function cloneDeep( object ) {
	return JSON.parse( JSON.stringify( object ) );
}

function usePushBlockStylesToUserStyles( { name, attributes, setAttributes } ) {
	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );

	return () => {
		const { style: blockStyles } = attributes;

		let newBlockStyles = null;
		let newUserConfig = null;

		const supportedKeys = getSupportedGlobalStylesPanels( name );
		for ( const key of supportedKeys ) {
			const { value: valuePath } = STYLE_PROPERTY[ key ];

			const value = get( attributes.style, valuePath );
			if ( ! value ) {
				continue;
			}

			newBlockStyles ??= cloneDeep( blockStyles );
			set( newBlockStyles, valuePath, undefined );

			newUserConfig ??= cloneDeep( userConfig );
			set(
				newUserConfig,
				[ 'styles', 'blocks', name, ...valuePath ],
				value
			);
		}

		if ( newBlockStyles ) {
			setAttributes( { style: newBlockStyles } );
		}

		if ( newUserConfig ) {
			setUserConfig( () => newUserConfig );
		}
	};
}

const withPushChangesToGlobalStyles = createHigherOrderComponent(
	( BlockEdit ) => ( props ) =>
		(
			<>
				<BlockEdit { ...props } />
				<InspectorAdvancedControls>
					<BaseControl
						help={ __(
							'Make this the default style for all Button blocks used across your site.'
						) }
					>
						<BaseControl.VisualLabel>
							{ __( 'Styles' ) }
						</BaseControl.VisualLabel>
						<Button
							variant="primary"
							onClick={ usePushBlockStylesToUserStyles( props ) }
						>
							{ __( 'Push changes to Global Styles' ) }
						</Button>
					</BaseControl>
				</InspectorAdvancedControls>
			</>
		)
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/push-changes-to-global-styles',
	withPushChangesToGlobalStyles
);
