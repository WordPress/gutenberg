/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	arrowLeft,
	arrowRight,
	arrowUp,
	close,
	swatch,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { store as blockEditorStore } from '../store';

const effectsOptions = [
	{
		label: __( 'Slide from left' ),
		value: 'slide-from-left',
		icon: arrowRight,
	},
	{
		label: __( 'Slide from right' ),
		value: 'slide-from-right',
		icon: arrowLeft,
	},
	{
		label: __( 'Slide from bottom' ),
		value: 'slide-from-bottom',
		icon: arrowUp,
	},
	{
		label: __( 'Fade in' ),
		value: 'fade-in',
		icon: swatch,
	},
	{
		label: __( 'None' ),
		value: undefined,
		icon: close,
	},
];

// TODO: attributes would be: `effect` with the data and `effectType`(entrance, exit, etc..).

export default function BlockEditorEffectsPanel( { clientId } ) {
	const attributes = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return getBlockAttributes( clientId );
		},
		[ clientId ]
	);
	const { effect, effectDuration } = attributes;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	return (
		<PanelBody
			className="block-editor-block-inspector__effects"
			title={ __( 'Effects' ) }
			initialOpen
		>
			<ToggleGroupControl
				className="block-editor-hooks__effects-entrance-contorls"
				label={ __( 'Entrance effect' ) }
				value={ effect }
				onChange={ ( value ) =>
					updateBlockAttributes( clientId, { effect: value } )
				}
			>
				{ effectsOptions.map( ( option, index ) => (
					<ToggleGroupControlOptionIcon
						key={ option.value || index }
						{ ...option }
						showTooltip
					/>
				) ) }
			</ToggleGroupControl>
			{ effect && (
				<NumberControl
					label={ __( 'Duration(seconds)' ) }
					step={ 0.1 }
					value={ effectDuration || '' }
					onChange={ ( value ) =>
						updateBlockAttributes( clientId, {
							effectDuration: value,
						} )
					}
					min={ 0.1 }
					__unstableInputWidth="120px"
					spinControls="custom"
					__nextHasNoMarginBottom
				/>
			) }
		</PanelBody>
	);
}

/**
 * Filters registered block settings, extending attributes to include
 * `effect` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttributes( settings ) {
	settings.attributes = {
		...settings.attributes,
		effect: {
			type: 'string',
			source: 'attribute',
			attribute: 'data-effect',
			selector: '[data-effect]',
		},
		effectDuration: {
			type: 'string',
			source: 'attribute',
			attribute: 'data-effect-duration',
			selector: '[data-effect-duration]',
		},
	};
	return settings;
}

/**
 * Filters registered block settings to expand the block edit wrapper
 * by applying the desired styles and classnames.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addEditProps( settings ) {
	const existingGetEditWrapperProps = settings.getEditWrapperProps;
	settings.getEditWrapperProps = ( attributes ) => {
		let props = {};
		if ( existingGetEditWrapperProps ) {
			props = existingGetEditWrapperProps( attributes );
		}
		return addSaveProps( props, settings, attributes );
	};

	return settings;
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the effect value.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withInspectorControl = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			if ( ! props.isSelected ) {
				return <BlockEdit { ...props } />;
			}
			return (
				<>
					<BlockEdit { ...props } />
					<InspectorControls>
						<BlockEditorEffectsPanel clientId={ props.clientId } />
					</InspectorControls>
				</>
			);
		};
	},
	'withInspectorControl'
);

/**
 * Override props assigned to save component to inject the `data-effect`
 * attribute.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	return {
		...extraProps,
		'data-effect': attributes.effect,
		'data-effect-duration': attributes.effectDuration,
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/effects/addAttribute',
	addAttributes
);
addFilter(
	'editor.BlockEdit',
	'core/editor/effects/with-inspector-control',
	withInspectorControl
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/effects/save-props',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/effects/addEditProps',
	addEditProps
);
