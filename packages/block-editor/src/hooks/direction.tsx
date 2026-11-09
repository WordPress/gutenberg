import { addFilter } from '@wordpress/hooks';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import InspectorControls from '../components/inspector-controls';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { store as blockEditorStore } from '../store';
import { shouldSkipSerialization } from './utils';
import { TYPOGRAPHY_SUPPORT_KEY } from './typography';
import type { BlockWrapperProps } from './types';

export const DIRECTION_SUPPORT_KEY = 'typography.direction';

const DIRECTIONS = [ 'ltr', 'rtl', 'auto' ];

interface DirectionEditProps {
	name: string;
	clientId: string;
	direction?: string;
	setAttributes: ( attributes: { direction?: string } ) => void;
}

/**
 * Filters registered block settings, extending attributes to include
 * the `direction` attribute.
 *
 * @param settings Original block settings.
 * @return Filtered block settings.
 */
function addAttribute( settings: BlockType ): BlockType {
	if ( ! hasBlockSupport( settings, DIRECTION_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition.
	if ( settings.attributes?.direction ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			direction: {
				type: 'string',
				enum: DIRECTIONS,
			},
		},
	};
}

function DirectionEdit( {
	name,
	clientId,
	direction,
	setAttributes,
}: DirectionEditProps ) {
	const blockEditingMode = useBlockEditingMode();
	// `dir` is an HTML attribute, so it only applies to the block's base state.
	const hasSelectedBlockStyleState = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedBlockStyleState( clientId ),
		[ clientId ]
	);

	if ( hasSelectedBlockStyleState || blockEditingMode !== 'default' ) {
		return null;
	}

	// A block may define its own `direction` attribute with fewer values.
	const allowedDirections: string[] =
		getBlockType( name )?.attributes?.direction?.enum ?? DIRECTIONS;
	const options = [
		{
			value: 'ltr',
			label: _x( 'LTR', 'text direction' ),
			ariaLabel: __( 'Left to right' ),
		},
		{
			value: 'rtl',
			label: _x( 'RTL', 'text direction' ),
			ariaLabel: __( 'Right to left' ),
		},
		{
			value: 'auto',
			label: _x( 'Auto', 'text direction' ),
			ariaLabel: __( 'Detect from content' ),
		},
	].filter( ( option ) => allowedDirections.includes( option.value ) );

	return (
		<InspectorControls group="typography">
			<ToolsPanelItem
				hasValue={ () => !! direction }
				label={ __( 'Text direction' ) }
				onDeselect={ () => setAttributes( { direction: undefined } ) }
				resetAllFilter={ () => ( { direction: undefined } ) }
				panelId={ clientId }
			>
				<ToggleGroupControl
					isBlock
					isDeselectable
					label={ __( 'Text direction' ) }
					value={ direction }
					onChange={ ( newDirection ) =>
						setAttributes( {
							direction: newDirection as string | undefined,
						} )
					}
				>
					{ options.map( ( option ) => (
						<ToggleGroupControlOption
							key={ option.value }
							value={ option.value }
							label={ option.label }
							aria-label={ option.ariaLabel }
							showTooltip
						/>
					) ) }
				</ToggleGroupControl>
			</ToolsPanelItem>
		</InspectorControls>
	);
}

function getDirectionProps(
	blockType: BlockType | string,
	direction?: string
) {
	if (
		! direction ||
		! DIRECTIONS.includes( direction ) ||
		! hasBlockSupport( blockType, DIRECTION_SUPPORT_KEY ) ||
		shouldSkipSerialization(
			blockType,
			TYPOGRAPHY_SUPPORT_KEY,
			'direction'
		)
	) {
		return {};
	}
	return { dir: direction };
}

/**
 * Override props applied to the block element in the editor.
 *
 * @param props           Component props including block attributes.
 * @param props.name      Block name.
 * @param props.direction Text direction.
 * @return Filtered props applied to the block element.
 */
function useBlockProps( {
	name,
	direction,
}: {
	name: string;
	direction?: string;
} ) {
	return getDirectionProps( name, direction );
}

/**
 * Override props applied to the block element on save.
 *
 * @param props                Additional props applied to the block element.
 * @param blockType            Block type.
 * @param attributes           Block attributes.
 * @param attributes.direction Text direction.
 * @return Filtered props applied to the block element.
 */
export function addSaveProps(
	props: BlockWrapperProps,
	blockType: BlockType | string,
	attributes: { direction?: string }
): BlockWrapperProps {
	return {
		...props,
		...getDirectionProps( blockType, attributes.direction ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/direction/addAttribute',
	addAttribute
);

export default {
	edit: DirectionEdit,
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'direction' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, DIRECTION_SUPPORT_KEY );
	},
};
