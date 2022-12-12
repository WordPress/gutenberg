/**
 * External dependencies
 */
import { get, set } from 'lodash';
import { capitalCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorAdvancedControls } from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	getBlockType,
} from '@wordpress/blocks';
import { useContext } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels } from '../components/global-styles/hooks';
import { GlobalStylesContext } from '../components/global-styles/context';
import {
	STYLE_PATH_TO_CSS_VAR_INFIX,
	STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE,
} from '../components/global-styles/utils';

function cloneDeep( object ) {
	return JSON.parse( JSON.stringify( object ) );
}

function usePushBlockStylesToUserStyles( { name, attributes, setAttributes } ) {
	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );
	const { createSuccessNotice } = useDispatch( noticesStore );

	return () => {
		const { style: blockStyles = {} } = attributes;

		let newBlockStyles = null;
		let newUserConfig = null;
		const changedKeys = [];

		const supportedKeys = getSupportedGlobalStylesPanels( name );
		for ( const key of supportedKeys ) {
			const { value: valuePath } = STYLE_PROPERTY[ key ];
			const presetAttributeKey = valuePath.join( '.' );
			const presetAttributeValue =
				attributes[
					STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE[ presetAttributeKey ]
				];
			const value = get( attributes.style, valuePath );

			if ( ! value && ! presetAttributeValue ) {
				continue;
			}

			newBlockStyles ??= cloneDeep( blockStyles );
			set( newBlockStyles, valuePath, undefined );

			const pushedValue = presetAttributeValue
				? `var:preset|${ STYLE_PATH_TO_CSS_VAR_INFIX[ presetAttributeKey ] }|${ presetAttributeValue }`
				: value;

			newUserConfig ??= cloneDeep( userConfig );
			set(
				newUserConfig,
				[ 'styles', 'blocks', name, ...valuePath ],
				pushedValue
			);

			changedKeys.push( key );
		}

		if ( changedKeys.length ) {
			// TODO: Make these two calls not create an undo level since we have
			// our own Undo functionality in the toast below. In the longer term
			// we should use the regular undo/redo functionality. Doing this
			// requires us to be able to create a single undo level here instead
			// of two.
			setAttributes( { style: newBlockStyles } );
			setUserConfig( () => newUserConfig );

			createSuccessNotice(
				sprintf(
					// translators: %1$s: Title of the block e.g. 'Heading'. %2$s: List of style properties e.g. 'Color, Link Color, Font Size'.
					__( 'Applied to all %1$s blocks: %2$s.' ),
					getBlockType( name ).title,
					changedKeys.map( capitalCase ).join( ', ' )
				),
				{
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick() {
								setAttributes( { style: blockStyles } );
								setUserConfig( () => userConfig );
							},
						},
					],
				}
			);
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
							"Apply this block's styles to all blocks of this type. Note that only typography, spacing, dimensions, color and border styles will be applied."
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
