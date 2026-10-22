import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	InspectorAdvancedControls,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { BaseControl, Button, RadioControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	__EXPERIMENTAL_STYLE_PROPERTY,
	getBlockType,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import { useMemo, useCallback, useState } from '@wordpress/element';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';
import setNestedValue from '../../utils/set-nested-value';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import ApplyGloballyModal from './apply-globally-modal';
import {
	STYLE_PATH_TO_CSS_VAR_INFIX,
	STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE,
	getValueFromObjectPath,
} from './style-paths';
import {
	SCOPE_GLOBAL,
	SCOPE_SIBLINGS,
	getSiblingStylesUpdate,
} from './sibling-styles';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

// Block Gap is a special case and isn't defined within the blocks
// style properties config. We'll add it here to allow it to be pushed
// to global styles as well.
const STYLE_PROPERTY = {
	...__EXPERIMENTAL_STYLE_PROPERTY,
	blockGap: { value: [ 'spacing', 'blockGap' ] },
};

const SUPPORTED_STYLES = [ 'border', 'color', 'spacing', 'typography' ];

const sides = [ 'top', 'right', 'bottom', 'left' ];

/**
 * One style change shown as a single row. It holds every `{ path, value }` pair
 * the change covers so they all get pushed together.
 *
 * @typedef {Object} ChangeRow
 * @property {string}                            id               Unique row id.
 * @property {string[]}                          primaryPath      Path used to look up the current value.
 * @property {Array<{path: string[], value: *}>} paths            The path/value pairs to push.
 * @property {string[]}                          presetAttributes Preset block attributes to clear when pushed.
 * @property {*}                                 newValue         Value shown in the "New" column.
 * @property {string}                            [format]         How to display the value (`border`, `borderRadius`, `spacing`).
 */

/**
 * Finds the nearest ancestor holding more than one block of this type, and the
 * other blocks of that type inside it.
 *
 * That ancestor is the scope the styles get applied to: for a Button it's the
 * Buttons block, for an Accordion Heading it's the Accordion. Blocks of the
 * same type anywhere inside it count, not only immediate children, because the
 * blocks that should match are often a level or two down, as an Accordion
 * Heading is.
 *
 * @param {string} blockName The block's name.
 * @param {string} clientId  The block's clientId.
 *
 * @return {{scopeBlockTitle: ?string, siblingClientIds: string[]}} The
 *   ancestor's title, and the clientIds to apply styles to.
 */
function useSiblingScope( blockName, clientId ) {
	// Kept separate from the clientIds below: `useSelect` compares its result
	// shallowly, so an object wrapping an array re-renders on every store
	// change while an array of strings doesn't.
	const { parentClientId, scopeBlockTitle } = useSelect(
		( select ) => {
			const { getBlockParents, getBlockName, getClientIdsOfDescendants } =
				select( blockEditorStore );

			for ( const parentId of getBlockParents( clientId, true ) ) {
				const hasSibling = getClientIdsOfDescendants( parentId ).some(
					( descendantId ) =>
						descendantId !== clientId &&
						getBlockName( descendantId ) === blockName
				);

				if ( hasSibling ) {
					return {
						parentClientId: parentId,
						scopeBlockTitle:
							getBlockType( getBlockName( parentId ) )?.title ??
							null,
					};
				}
			}

			return { parentClientId: null, scopeBlockTitle: null };
		},
		[ blockName, clientId ]
	);

	const siblingClientIds = useSelect(
		( select ) => {
			if ( ! parentClientId ) {
				return [];
			}

			const { getBlockName, getClientIdsOfDescendants } =
				select( blockEditorStore );

			return getClientIdsOfDescendants( parentClientId ).filter(
				( descendantId ) =>
					descendantId !== clientId &&
					getBlockName( descendantId ) === blockName
			);
		},
		[ parentClientId, blockName, clientId ]
	);

	return { scopeBlockTitle, siblingClientIds };
}

// Builds the border rows, grouped so each one reads as a single CSS `border`
// value (all sides, one side, and radius) instead of a row per property.
function getBorderRows( supports, attributes, blockUserConfig ) {
	const rows = [];
	const border = attributes.style?.border;
	const userBorder = blockUserConfig?.border;

	const colorSupported = supports.includes( 'borderColor' );
	const widthSupported = supports.includes( 'borderWidth' );
	const styleSupported = supports.includes( 'borderStyle' );

	// The all-sides border. A preset border color lives in a block attribute
	// and is pushed as a preset value.
	const presetBorderColor = attributes.borderColor;
	const flatColor = presetBorderColor
		? `var:preset|color|${ presetBorderColor }`
		: border?.color;
	const flatRow = buildBorderScopeRow( {
		id: 'border',
		primaryPath: [ 'border' ],
		side: null,
		color: colorSupported ? flatColor : undefined,
		width: widthSupported ? border?.width : undefined,
		style: styleSupported ? border?.style : undefined,
		userBorder,
		presetAttributes: presetBorderColor ? [ 'borderColor' ] : [],
	} );
	if ( flatRow ) {
		rows.push( flatRow );
	}

	sides.forEach( ( side ) => {
		const sideBorder = border?.[ side ];
		const sideRow = buildBorderScopeRow( {
			id: `border.${ side }`,
			primaryPath: [ 'border', side ],
			side,
			color: colorSupported ? sideBorder?.color : undefined,
			width: widthSupported ? sideBorder?.width : undefined,
			style: styleSupported ? sideBorder?.style : undefined,
			userBorder,
			presetAttributes: [],
		} );
		if ( sideRow ) {
			rows.push( sideRow );
		}
	} );

	// Border radius, pushed as-is (a string or an object per corner) since
	// Global Styles takes either.
	if (
		supports.includes( 'borderRadius' ) &&
		border?.radius !== undefined &&
		border?.radius !== ''
	) {
		rows.push( {
			id: 'border.radius',
			primaryPath: [ 'border', 'radius' ],
			paths: [ { path: [ 'border', 'radius' ], value: border.radius } ],
			presetAttributes: [],
			newValue: border.radius,
			format: 'borderRadius',
		} );
	}

	return rows;
}

// Builds one border row (all sides or a single side) that pushes its color,
// width and style together and shows them as one CSS value. Returns `null`
// when there's nothing set.
function buildBorderScopeRow( {
	id,
	primaryPath,
	side,
	color,
	width,
	style,
	userBorder,
	presetAttributes,
} ) {
	if ( ! color && ! width && ! style ) {
		return null;
	}

	const paths = [];
	// The all-sides value is also written to each side so it can override any
	// per-side values from theme.json.
	const targetSides = side ? [ side ] : sides;

	const addChange = ( property, value ) => {
		if ( value === undefined ) {
			return;
		}
		if ( ! side ) {
			paths.push( { path: [ 'border', property ], value } );
		}
		targetSides.forEach( ( targetSide ) => {
			paths.push( { path: [ 'border', targetSide, property ], value } );
		} );
	};

	addChange( 'color', color );
	addChange( 'width', width );
	addChange( 'style', style );

	// A border only shows with a style, so use `solid` when a color or width
	// is set without one (unless Global Styles already sets a style for that
	// side, which is kept).
	let effectiveStyle = style;
	if ( ! style && ( color || width ) ) {
		const sideStyles = targetSides.map(
			( targetSide ) => userBorder?.[ targetSide ]?.style
		);
		targetSides.forEach( ( targetSide, index ) => {
			if ( ! sideStyles[ index ] ) {
				paths.push( {
					path: [ 'border', targetSide, 'style' ],
					value: 'solid',
				} );
			}
		} );
		// Show the style the border will actually have after Apply: the shared
		// Global Styles style when every side agrees on one, else `solid`.
		const sharedStyle = sideStyles.every(
			( sideStyle ) => sideStyle === sideStyles[ 0 ]
		)
			? sideStyles[ 0 ]
			: undefined;
		effectiveStyle = sharedStyle || 'solid';
	}

	return {
		id,
		primaryPath,
		paths,
		presetAttributes,
		newValue: { color, width, style: effectiveStyle },
		format: 'border',
	};
}

/**
 * Works out which of the block's style changes can be pushed to Global Styles,
 * grouped into rows (see `ChangeRow`).
 *
 * @param {Array}  supports        Supported style keys for the block.
 * @param {Object} attributes      Block attributes.
 * @param {Object} blockUserConfig The block's user Global Styles config.
 *
 * @return {ChangeRow[]} The changes, grouped into rows.
 */
export function getChangesToPush( supports, attributes, blockUserConfig ) {
	const rows = [];

	supports.forEach( ( key ) => {
		if ( ! STYLE_PROPERTY[ key ] ) {
			return;
		}
		// Border styles are grouped and handled separately below.
		if ( key.startsWith( 'border' ) ) {
			return;
		}
		// Root-only properties (e.g. `--wp--style--root--padding`) repeat their
		// normal version (`padding`) and only apply to the root, so skip them.
		if ( STYLE_PROPERTY[ key ].rootOnly ) {
			return;
		}
		const { value: path } = STYLE_PROPERTY[ key ];
		const presetAttributeKey = path.join( '.' );
		const presetAttributeName =
			STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE[ presetAttributeKey ];
		const presetAttributeValue = presetAttributeName
			? attributes[ presetAttributeName ]
			: undefined;
		const value = presetAttributeValue
			? `var:preset|${ STYLE_PATH_TO_CSS_VAR_INFIX[ presetAttributeKey ] }|${ presetAttributeValue }`
			: getValueFromObjectPath( attributes.style, path );

		// A preset attribute is only removed from the block when its row is
		// pushed (see `getStylesUpdate`).
		const presetAttributes = presetAttributeValue
			? [ presetAttributeName ]
			: [];

		// Links have a single support but two styles: color and hover color.
		// Add the hover color to the changes when it's set.
		if ( key === 'linkColor' ) {
			const paths = value ? [ { path, value } ] : [];
			const hoverPath = [ 'elements', 'link', ':hover', 'color', 'text' ];
			const hoverValue = getValueFromObjectPath(
				attributes.style,
				hoverPath
			);

			if ( hoverValue ) {
				paths.push( { path: hoverPath, value: hoverValue } );
			}

			if ( paths.length === 0 ) {
				return;
			}

			rows.push( {
				id: presetAttributeKey,
				primaryPath: path,
				paths,
				presetAttributes,
				newValue: value ?? hoverValue,
			} );
			return;
		}

		if ( value ) {
			// Padding and margin can be axial or per-side objects. The format
			// hint lets them show as one CSS value instead of a row per side
			// or a raw object. Block gap can be an axial `{ top, left }` object.
			let format;
			if ( key === 'padding' || key === 'margin' ) {
				format = 'spacing';
			} else if ( key === 'blockGap' ) {
				format = 'blockGap';
			}
			rows.push( {
				id: presetAttributeKey,
				primaryPath: path,
				paths: [ { path, value } ],
				presetAttributes,
				newValue: value,
				format,
			} );
		}
	} );

	rows.push( ...getBorderRows( supports, attributes, blockUserConfig ) );

	return rows;
}

function useChangesToPush( name, attributes, userConfig ) {
	const supports = useSelect(
		( select ) => {
			return unlock( select( blocksStore ) ).getSupportedStyles( name );
		},
		[ name ]
	);
	const blockUserConfig = userConfig?.styles?.blocks?.[ name ];

	return useMemo(
		() => getChangesToPush( supports, attributes, blockUserConfig ),
		[ supports, attributes, blockUserConfig ]
	);
}

/**
 * Works out the block attribute and user Global Styles updates for the chosen
 * rows, without applying them. Returns `null` when there's nothing to push.
 *
 * @param {Object} options            Options.
 * @param {Array}  options.rowsToPush The rows to push.
 * @param {Object} options.attributes Current block attributes.
 * @param {Object} options.userConfig Current user Global Styles config.
 * @param {string} options.name       Block name.
 *
 * @return {?{newBlockAttributes: Object, newUserConfig: Object}} The updates,
 *   or `null` when no rows were chosen.
 */
export function getStylesUpdate( {
	rowsToPush,
	attributes,
	userConfig,
	name,
} ) {
	if ( ! rowsToPush || rowsToPush.length === 0 ) {
		return null;
	}

	const selectedChanges = rowsToPush.flatMap( ( row ) => row.paths );

	if ( selectedChanges.length === 0 ) {
		return null;
	}

	const { style: blockStyles } = attributes;

	const newBlockStyles = structuredClone( blockStyles );
	const newUserConfig = structuredClone( userConfig );

	for ( const { path, value } of selectedChanges ) {
		setNestedValue( newBlockStyles, path, undefined );
		setNestedValue(
			newUserConfig,
			[ 'styles', 'blocks', name, ...path ],
			value
		);
	}

	// Only clear the preset attributes from the rows being pushed. Clearing
	// them all would wipe unselected preset styles from the block without
	// pushing them to Global Styles.
	const newBlockAttributes = {
		style: cleanEmptyObject( newBlockStyles ),
	};
	for ( const presetAttribute of rowsToPush.flatMap(
		( row ) => row.presetAttributes
	) ) {
		newBlockAttributes[ presetAttribute ] = undefined;
	}

	return { newBlockAttributes, newUserConfig };
}

function PushChangesToGlobalStylesControl( {
	name,
	attributes,
	setAttributes,
	clientId,
	isBlockBasedTheme,
} ) {
	const { user: userConfig, setUser: setUserConfig } = useGlobalStyles();

	const rows = useChangesToPush( name, attributes, userConfig );

	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { scopeBlockTitle, siblingClientIds } = useSiblingScope(
		name,
		clientId
	);

	const registry = useRegistry();
	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const hasSiblingScope = siblingClientIds.length > 0;
	// Global Styles has nowhere to write to without a block theme, but the
	// siblings are in the content, so that scope works either way.
	const hasGlobalScope = !! isBlockBasedTheme;

	const [ selectedScope, setSelectedScope ] = useState( SCOPE_GLOBAL );
	// The sibling scope comes and goes with the selected block, so fall back to
	// whichever scope the block actually has.
	let scope = selectedScope;
	if ( ! hasSiblingScope ) {
		scope = SCOPE_GLOBAL;
	} else if ( ! hasGlobalScope ) {
		scope = SCOPE_SIBLINGS;
	}

	const pushChanges = useCallback(
		( rowsToPush ) => {
			const update = getStylesUpdate( {
				rowsToPush,
				attributes,
				userConfig,
				name,
			} );

			if ( ! update ) {
				return;
			}

			const { newBlockAttributes, newUserConfig } = update;

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
		},
		[
			__unstableMarkNextChangeAsNotPersistent,
			attributes,
			createSuccessNotice,
			name,
			setAttributes,
			setUserConfig,
			userConfig,
		]
	);

	const applyToSiblings = useCallback(
		( rowsToApply ) => {
			const { getBlockAttributes } = registry.select( blockEditorStore );
			const siblings = siblingClientIds.map( ( siblingClientId ) => ( {
				clientId: siblingClientId,
				attributes: getBlockAttributes( siblingClientId ),
			} ) );

			const updates = getSiblingStylesUpdate( {
				rowsToApply,
				attributes,
				siblings,
			} );

			if ( ! updates ) {
				return;
			}

			// Only blocks change here, so the editor's own undo covers it and
			// there's no need for the custom Undo that `pushChanges` adds.
			updateBlockAttributes( Object.keys( updates ), updates, {
				uniqueByBlock: true,
			} );

			createSuccessNotice(
				sprintf(
					// translators: 1: Title of the block e.g. 'Button'. 2: Title of the parent block e.g. 'Buttons'.
					__( '%1$s styles applied in this %2$s.' ),
					getBlockType( name ).title,
					scopeBlockTitle
				),
				{ type: 'snackbar' }
			);
		},
		[
			attributes,
			createSuccessNotice,
			name,
			registry,
			scopeBlockTitle,
			siblingClientIds,
			updateBlockAttributes,
		]
	);

	// Nothing to apply to: a classic theme, and no siblings to match.
	if ( ! hasSiblingScope && ! hasGlobalScope ) {
		return null;
	}

	const blockTitle = getBlockType( name ).title;
	const isSiblingScope = scope === SCOPE_SIBLINGS;

	return (
		<BaseControl
			className="editor-push-changes-to-global-styles-control"
			help={
				isSiblingScope
					? sprintf(
							// translators: 1: Title of the block e.g. 'Button'. 2: Title of the parent block e.g. 'Buttons'.
							__(
								'Review and copy this block’s typography, spacing, dimensions, and color styles to every other %1$s block in this %2$s.'
							),
							blockTitle,
							scopeBlockTitle
						)
					: sprintf(
							// translators: %s: Title of the block e.g. 'Heading'.
							__(
								'Review and apply this block’s typography, spacing, dimensions, and color styles to all %s blocks.'
							),
							blockTitle
						)
			}
		>
			<BaseControl.VisualLabel>
				{ __( 'Styles' ) }
			</BaseControl.VisualLabel>
			{ hasSiblingScope && hasGlobalScope && (
				<RadioControl
					label={ __( 'Apply styles to' ) }
					selected={ scope }
					options={ [
						{
							label: sprintf(
								// translators: %s: Title of the block e.g. 'Heading'.
								__( 'All %s blocks on the site' ),
								blockTitle
							),
							value: SCOPE_GLOBAL,
						},
						{
							label: sprintf(
								// translators: 1: Title of the block e.g. 'Button'. 2: Title of the parent block e.g. 'Buttons'.
								__( 'All %1$s blocks in this %2$s' ),
								blockTitle,
								scopeBlockTitle
							),
							value: SCOPE_SIBLINGS,
						},
					] }
					onChange={ setSelectedScope }
				/>
			) }
			<Button
				__next40pxDefaultSize
				variant="secondary"
				accessibleWhenDisabled
				disabled={ rows.length === 0 }
				onClick={ () => setIsModalOpen( true ) }
			>
				{ hasSiblingScope
					? __( 'Review and apply' )
					: __( 'Apply globally' ) }
			</Button>
			{ isModalOpen && (
				<ApplyGloballyModal
					name={ name }
					rows={ rows }
					scope={ scope }
					scopeBlockTitle={ scopeBlockTitle }
					siblingClientIds={ siblingClientIds }
					onApply={ isSiblingScope ? applyToSiblings : pushChanges }
					onRequestClose={ () => setIsModalOpen( false ) }
				/>
			) }
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

	// `isBlockBasedTheme` is no longer part of this gate: the sibling scope
	// writes to the content rather than to Global Styles, so it works on a
	// classic theme too. The control itself bows out when neither scope
	// applies.
	if ( blockEditingMode !== 'default' || ! supportsStyles ) {
		return null;
	}

	return (
		<InspectorAdvancedControls>
			<PushChangesToGlobalStylesControl
				{ ...props }
				isBlockBasedTheme={ isBlockBasedTheme }
			/>
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
	'core/editor/push-changes-to-global-styles',
	withPushChangesToGlobalStyles
);
