import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import {
	AnglePickerControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { __ } from '@wordpress/i18n';
import InspectorControls from '../components/inspector-controls';
import { useSettings } from '../components/use-settings';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { isPlainObject } from '../utils/object';
import {
	fromPickerAngle,
	getRotateForState,
	getRotateStateStyle,
	getRotateValue,
	getStyleObject,
	getUpdatedRotateStyle,
	toPickerAngle,
} from '../utils/rotation';
import { cleanEmptyObject, usePrivateStyleOverride } from './utils';
import {
	BlockStyleStateProvider,
	hasPseudoBlockStyleState,
} from './block-style-state';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

export const ROTATION_SUPPORT_KEY = 'rotation';

const ROTATE_STYLE_KEY = 'rotate';

type BlockStyle = Record< string, any >;

interface BlockAttributes {
	style?: BlockStyle;
	[ key: string ]: unknown;
}

interface RotateEditProps {
	clientId: string;
	name: string;
	setAttributes: ( attributes: BlockAttributes ) => void;
	style?: BlockStyle;
}

// Used for generating the instance ID.
const ROTATE_BLOCK_PROPS_REFERENCE = {};

/**
 * Returns whether a block supports rotation. Blocks must opt in with
 * `supports.rotation: true`, and must not define a `style` attribute of their
 * own that is not an object, which rotation could not be stored in.
 *
 * @param nameOrType Block name or block type object.
 *
 * @return Whether the block supports rotation.
 */
export function hasRotateSupport( nameOrType: string | BlockType ): boolean {
	const blockType =
		typeof nameOrType === 'string'
			? getBlockType( nameOrType )
			: nameOrType;
	const styleType = blockType?.attributes?.style?.type;
	return (
		( styleType === undefined || styleType === 'object' ) &&
		hasBlockSupport( nameOrType, ROTATION_SUPPORT_KEY, false )
	);
}

/**
 * Returns whether a block style attribute holds any rotation.
 *
 * @param style Block style attribute.
 *
 * @return Whether there is a rotation in the default or a viewport state.
 */
function hasRotateValue( style: BlockStyle | undefined ): boolean {
	return Object.entries( getStyleObject( style ) ?? {} ).some(
		( [ key, value ] ) =>
			key === ROTATE_STYLE_KEY ||
			( key.startsWith( '@' ) &&
				isPlainObject( value ) &&
				value[ ROTATE_STYLE_KEY ] !== undefined )
	);
}

/**
 * Generates the CSS that rotates a block, including viewport overrides.
 *
 * The `rotate` property is used rather than `transform` so that it doesn't
 * clash with the transforms the editor applies to animate block moves.
 *
 * @param style            Block style attribute.
 * @param selector         Selector of the block.
 * @param viewportSettings Viewport breakpoint settings.
 *
 * @return The generated stylesheet.
 */
export function getRotateCSS(
	style: BlockStyle | undefined,
	selector: string,
	viewportSettings?: Record< string, unknown >
): string {
	const rules: string[] = [];
	const rotate = getRotateValue( getStyleObject( style )?.rotate );
	if ( rotate ) {
		rules.push( `${ selector }{rotate:${ rotate }deg;}` );
	}

	Object.entries( getResponsiveMediaQueries( viewportSettings ) ).forEach(
		( [ viewport, mediaQuery ] ) => {
			const viewportRotate = getRotateValue(
				getRotateStateStyle( style, { viewport } )?.rotate
			);
			if ( viewportRotate === undefined ) {
				return;
			}
			// In a viewport, 0 undoes the default rotation.
			const value = viewportRotate ? `${ viewportRotate }deg` : 'none';
			rules.push( `${ mediaQuery }{${ selector }{rotate:${ value };}}` );
		}
	);

	return rules.join( '' );
}

/**
 * Removes the rotation from a block's attributes. The inspector controls
 * scope it to the selected style state.
 *
 * @param attributes Block attributes.
 *
 * @return The block attributes without rotation.
 */
function resetRotate( attributes: BlockAttributes ): BlockAttributes {
	return {
		...attributes,
		style: cleanEmptyObject( {
			...attributes.style,
			rotate: undefined,
		} ),
	};
}

function RotateControl( { clientId, setAttributes, style }: RotateEditProps ) {
	const { blockEditingMode, selectedState } = useSelect(
		( select ) => {
			const { getBlockEditingMode, getSelectedBlockStyleState } =
				select( blockEditorStore );
			return {
				blockEditingMode: getBlockEditingMode( clientId ),
				selectedState: getSelectedBlockStyleState( clientId ),
			};
		},
		[ clientId ]
	);

	if (
		blockEditingMode !== 'default' ||
		hasPseudoBlockStyleState( selectedState )
	) {
		return null;
	}

	const stateStyle = getRotateStateStyle( style, selectedState );
	const updateRotate = ( angle: number | undefined ) =>
		setAttributes( {
			style: getUpdatedRotateStyle( style, angle, selectedState ),
		} );

	return (
		// The provider scopes the panel's "Reset all" to the selected state.
		<BlockStyleStateProvider value={ selectedState }>
			<InspectorControls
				group="position-tools"
				resetAllFilter={ resetRotate }
			>
				<ToolsPanelItem
					hasValue={ () => stateStyle?.rotate !== undefined }
					label={ __( 'Rotation' ) }
					onDeselect={ () => updateRotate( undefined ) }
					isShownByDefault={ false }
					panelId={ clientId }
				>
					<AnglePickerControl
						label={ __( 'Rotation' ) }
						value={ toPickerAngle(
							getRotateForState( style, selectedState )
						) }
						onChange={ ( value ) =>
							updateRotate( fromPickerAngle( value ) )
						}
					/>
				</ToolsPanelItem>
			</InspectorControls>
		</BlockStyleStateProvider>
	);
}

function useBlockProps( {
	clientId,
	style,
}: Pick< RotateEditProps, 'clientId' | 'style' > ) {
	// Settings are untyped.
	const [ viewportSettings ] = useSettings( 'viewport' ) as [
		Record< string, unknown > | undefined,
	];
	const className = useInstanceId(
		ROTATE_BLOCK_PROPS_REFERENCE,
		'wp-rotate'
	);
	const css = useMemo(
		() => getRotateCSS( style, `.${ className }`, viewportSettings ),
		[ style, className, viewportSettings ]
	);

	usePrivateStyleOverride( { css, clientId } );

	return css ? { className } : {};
}

export default {
	edit: RotateControl,
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport: hasRotateSupport,
	isMatch: ( { style }: { style?: BlockStyle } ) => hasRotateValue( style ),
};
