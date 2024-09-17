/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	InspectorAdvancedControls,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	__EXPERIMENTAL_STYLE_PROPERTY,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import { useContext, useMemo, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useSupportedStyles } from '../../components/global-styles/hooks';
import { unlock } from '../../lock-unlock';
import setNestedValue from '../../utils/set-nested-value';

const { cleanEmptyObject, GlobalStylesContext } = unlock(
	blockEditorPrivateApis
);

// Block Gap is a special case and isn't defined within the blocks
// style properties config. We'll add it here to allow it to be pushed
// to global styles as well.
const STYLE_PROPERTY = {
	...__EXPERIMENTAL_STYLE_PROPERTY,
	blockGap: { value: [ 'spacing', 'blockGap' ] },
};

// TODO: Temporary duplication of constant in @wordpress/block-editor. Can be
// removed by moving PushChangesToGlobalStylesControl to
// @wordpress/block-editor.
const STYLE_PATH_TO_CSS_VAR_INFIX = {
	'border.color': 'color',
	'color.background': 'color',
	'color.text': 'color',
	'elements.link.color.text': 'color',
	'elements.link.:hover.color.text': 'color',
	'elements.link.typography.fontFamily': 'font-family',
	'elements.link.typography.fontSize': 'font-size',
	'elements.button.color.text': 'color',
	'elements.button.color.background': 'color',
	'elements.button.typography.fontFamily': 'font-family',
	'elements.button.typography.fontSize': 'font-size',
	'elements.caption.color.text': 'color',
	'elements.heading.color': 'color',
	'elements.heading.color.background': 'color',
	'elements.heading.typography.fontFamily': 'font-family',
	'elements.heading.gradient': 'gradient',
	'elements.heading.color.gradient': 'gradient',
	'elements.h1.color': 'color',
	'elements.h1.color.background': 'color',
	'elements.h1.typography.fontFamily': 'font-family',
	'elements.h1.color.gradient': 'gradient',
	'elements.h2.color': 'color',
	'elements.h2.color.background': 'color',
	'elements.h2.typography.fontFamily': 'font-family',
	'elements.h2.color.gradient': 'gradient',
	'elements.h3.color': 'color',
	'elements.h3.color.background': 'color',
	'elements.h3.typography.fontFamily': 'font-family',
	'elements.h3.color.gradient': 'gradient',
	'elements.h4.color': 'color',
	'elements.h4.color.background': 'color',
	'elements.h4.typography.fontFamily': 'font-family',
	'elements.h4.color.gradient': 'gradient',
	'elements.h5.color': 'color',
	'elements.h5.color.background': 'color',
	'elements.h5.typography.fontFamily': 'font-family',
	'elements.h5.color.gradient': 'gradient',
	'elements.h6.color': 'color',
	'elements.h6.color.background': 'color',
	'elements.h6.typography.fontFamily': 'font-family',
	'elements.h6.color.gradient': 'gradient',
	'color.gradient': 'gradient',
	blockGap: 'spacing',
	'typography.fontSize': 'font-size',
	'typography.fontFamily': 'font-family',
};

// TODO: Temporary duplication of constant in @wordpress/block-editor. Can be
// removed by moving PushChangesToGlobalStylesControl to
// @wordpress/block-editor.
const STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE = {
	'border.color': 'borderColor',
	'color.background': 'backgroundColor',
	'color.text': 'textColor',
	'color.gradient': 'gradient',
	'typography.fontSize': 'fontSize',
	'typography.fontFamily': 'fontFamily',
};

const SUPPORTED_STYLES = [ 'border', 'color', 'spacing', 'typography' ];

const getValueFromObjectPath = ( object, path ) => {
	let value = object;
	path.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value;
};

const flatBorderProperties = [ 'borderColor', 'borderWidth', 'borderStyle' ];
const sides = [ 'top', 'right', 'bottom', 'left' ];

function getBorderStyleChanges( border, presetColor, userStyle ) {
	if ( ! border && ! presetColor ) {
		return [];
	}

	const changes = [
		...getFallbackBorderStyleChange( 'top', border, userStyle ),
		...getFallbackBorderStyleChange( 'right', border, userStyle ),
		...getFallbackBorderStyleChange( 'bottom', border, userStyle ),
		...getFallbackBorderStyleChange( 'left', border, userStyle ),
	];

	// Handle a flat border i.e. all sides the same, CSS shorthand.
	const { color: customColor, style, width } = border || {};
	const hasColorOrWidth = presetColor || customColor || width;

	if ( hasColorOrWidth && ! style ) {
		// Global Styles need individual side configurations to overcome
		// theme.json configurations which are per side as well.
		sides.forEach( ( side ) => {
			// Only add fallback border-style if global styles don't already
			// have something set.
			if ( ! userStyle?.[ side ]?.style ) {
				changes.push( {
					path: [ 'border', side, 'style' ],
					value: 'solid',
				} );
			}
		} );
	}

	return changes;
}

function getFallbackBorderStyleChange( side, border, globalBorderStyle ) {
	if ( ! border?.[ side ] || globalBorderStyle?.[ side ]?.style ) {
		return [];
	}

	const { color, style, width } = border[ side ];
	const hasColorOrWidth = color || width;

	if ( ! hasColorOrWidth || style ) {
		return [];
	}

	return [ { path: [ 'border', side, 'style' ], value: 'solid' } ];
}

function useChangesToPush( name, attributes, userConfig ) {
	const supports = useSupportedStyles( name );
	const blockUserConfig = userConfig?.styles?.blocks?.[ name ];

	return useMemo( () => {
		const changes = supports.flatMap( ( key ) => {
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
				: getValueFromObjectPath( attributes.style, path );

			// Links only have a single support entry but have two element
			// style properties, color and hover color. The following check
			// will add the hover color to the changes if required.
			if ( key === 'linkColor' ) {
				const linkChanges = value ? [ { path, value } ] : [];
				const hoverPath = [
					'elements',
					'link',
					':hover',
					'color',
					'text',
				];
				const hoverValue = getValueFromObjectPath(
					attributes.style,
					hoverPath
				);

				if ( hoverValue ) {
					linkChanges.push( { path: hoverPath, value: hoverValue } );
				}

				return linkChanges;
			}

			// The shorthand border styles can't be mapped directly as global
			// styles requires longhand config.
			if ( flatBorderProperties.includes( key ) && value ) {
				// The shorthand config path is included to clear the block attribute.
				const borderChanges = [ { path, value } ];
				sides.forEach( ( side ) => {
					const currentPath = [ ...path ];
					currentPath.splice( -1, 0, side );
					borderChanges.push( { path: currentPath, value } );
				} );
				return borderChanges;
			}

			return value ? [ { path, value } ] : [];
		} );

		// To ensure display of a visible border, global styles require a
		// default border style if a border color or width is present.
		getBorderStyleChanges(
			attributes.style?.border,
			attributes.borderColor,
			blockUserConfig?.border
		).forEach( ( change ) => changes.push( change ) );

		return changes;
	}, [ supports, attributes, blockUserConfig ] );
}

function PushChangesToGlobalStylesControl( {
	name,
	attributes,
	setAttributes,
} ) {
	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );

	const changes = useChangesToPush( name, attributes, userConfig );

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const pushChanges = useCallback( () => {
		if ( changes.length === 0 ) {
			return;
		}

		if ( changes.length > 0 ) {
			const { style: blockStyles } = attributes;

			const newBlockStyles = structuredClone( blockStyles );
			const newUserConfig = structuredClone( userConfig );

			for ( const { path, value } of changes ) {
				setNestedValue( newBlockStyles, path, undefined );
				setNestedValue(
					newUserConfig,
					[ 'styles', 'blocks', name, ...path ],
					value
				);
			}

			const newBlockAttributes = {
				borderColor: undefined,
				backgroundColor: undefined,
				textColor: undefined,
				gradient: undefined,
				fontSize: undefined,
				fontFamily: undefined,
				style: cleanEmptyObject( newBlockStyles ),
			};

			// @wordpress/core-data doesn't support editing multiple entity types in
			// a single undo level. So for now, we disable @wordpress/core-data undo
			// tracking and implement our own Undo button in the snackbar
			// notification.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( newBlockAttributes );
			setUserConfig( newUserConfig, { undoIgnore: true } );
			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the block e.g. 'Heading'.
					__( '%s styles applied.' ),
					getBlockType( name ).title
				),
				{
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick() {
								__unstableMarkNextChangeAsNotPersistent();
								setAttributes( attributes );
								setUserConfig( userConfig, {
									undoIgnore: true,
								} );
							},
						},
					],
				}
			);
		}
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		attributes,
		changes,
		createSuccessNotice,
		name,
		setAttributes,
		setUserConfig,
		userConfig,
	] );

	return (
		<BaseControl
			__nextHasNoMarginBottom
			className="edit-site-push-changes-to-global-styles-control"
			help={ sprintf(
				// translators: %s: Title of the block e.g. 'Heading'.
				__(
					'Apply this block’s typography, spacing, dimensions, and color styles to all %s blocks.'
				),
				getBlockType( name ).title
			) }
		>
			<BaseControl.VisualLabel>
				{ __( 'Styles' ) }
			</BaseControl.VisualLabel>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				accessibleWhenDisabled
				disabled={ changes.length === 0 }
				onClick={ pushChanges }
			>
				{ __( 'Apply globally' ) }
			</Button>
		</BaseControl>
	);
}

function PushChangesToGlobalStyles( props ) {
	const blockEditingMode = useBlockEditingMode();
	const isBlockBasedTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.is_block_theme,
		[]
	);
	const supportsStyles = SUPPORTED_STYLES.some( ( feature ) =>
		hasBlockSupport( props.name, feature )
	);
	const isDisplayed =
		blockEditingMode === 'default' && supportsStyles && isBlockBasedTheme;

	if ( ! isDisplayed ) {
		return null;
	}

	return (
		<InspectorAdvancedControls>
			<PushChangesToGlobalStylesControl { ...props } />
		</InspectorAdvancedControls>
	);
}

const withPushChangesToGlobalStyles = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => (
		<>
			<BlockEdit key="edit" { ...props } />
			{ props.isSelected && <PushChangesToGlobalStyles { ...props } /> }
		</>
	)
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/push-changes-to-global-styles',
	withPushChangesToGlobalStyles
);
