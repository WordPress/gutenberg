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
import {
	InspectorAdvancedControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	getBlockType,
} from '@wordpress/blocks';
import { useContext, useMemo, useCallback } from '@wordpress/element';
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

function getChangesToPush( name, attributes ) {
	return getSupportedGlobalStylesPanels( name ).flatMap( ( key ) => {
		if ( ! STYLE_PROPERTY[ key ] ) {
			return [];
		}
		const { value: path } = STYLE_PROPERTY[ key ];
		const presetAttributeKey = path.join( '.' );
		const presetAttributeValue =
			attributes[
				STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE[ presetAttributeKey ]
			];
		const value = presetAttributeValue
			? `var:preset|${ STYLE_PATH_TO_CSS_VAR_INFIX[ presetAttributeKey ] }|${ presetAttributeValue }`
			: get( attributes.style, path );
		return value ? [ { key, path, value } ] : [];
	} );
}

function cloneDeep( object ) {
	return JSON.parse( JSON.stringify( object ) );
}

function PushChangesToGlobalStylesControl( {
	name,
	attributes,
	setAttributes,
} ) {
	const changes = useMemo(
		() => getChangesToPush( name, attributes ),
		[ name, attributes ]
	);

	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const pushChanges = useCallback( () => {
		if ( changes.length === 0 ) {
			return;
		}

		const { style: blockStyles } = attributes;

		const newBlockStyles = cloneDeep( blockStyles );
		const newUserConfig = cloneDeep( userConfig );

		for ( const { path, value } of changes ) {
			set( newBlockStyles, path, undefined );
			set( newUserConfig, [ 'styles', 'blocks', name, ...path ], value );
		}

		// @wordpress/core-data doesn't support editing multiple entity types in
		// a single undo level. So for now, we disable @wordpress/core-data undo
		// tracking and implement our own Undo button in the snackbar
		// notification.
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { style: newBlockStyles } );
		setUserConfig( () => newUserConfig, { undoIgnore: true } );

		createSuccessNotice(
			sprintf(
				// translators: %1$s: Title of the block e.g. 'Heading'. %2$s: List of style properties e.g. 'Color, Link Color, Font Size'.
				__( 'Applied to all %1$s blocks: %2$s.' ),
				getBlockType( name ).title,
				changes.map( ( { key } ) => capitalCase( key ) ).join( ', ' )
			),
			{
				type: 'snackbar',
				actions: [
					{
						label: __( 'Undo' ),
						onClick() {
							__unstableMarkNextChangeAsNotPersistent();
							setAttributes( { style: blockStyles } );
							setUserConfig( () => userConfig, {
								undoIgnore: true,
							} );
						},
					},
				],
			}
		);
	}, [ changes, attributes, userConfig, name ] );

	return (
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
				disabled={ changes.length === 0 }
				onClick={ pushChanges }
			>
				{ __( 'Push changes to Global Styles' ) }
			</Button>
		</BaseControl>
	);
}

const withPushChangesToGlobalStyles = createHigherOrderComponent(
	( BlockEdit ) => ( props ) =>
		(
			<>
				<BlockEdit { ...props } />
				<InspectorAdvancedControls>
					<PushChangesToGlobalStylesControl { ...props } />
				</InspectorAdvancedControls>
			</>
		)
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/push-changes-to-global-styles',
	withPushChangesToGlobalStyles
);
