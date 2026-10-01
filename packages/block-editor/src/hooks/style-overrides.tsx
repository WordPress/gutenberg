import { useSelect } from '@wordpress/data';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import InspectorControls from '../components/inspector-controls';
import { useBlockEditingMode } from '../components/block-editing-mode';
import {
	getElementLayers,
	getHeadingLevel,
	useResolvedStyle,
} from '../components/global-styles/inherited-value-context';
import { isGlobalStylesInheritanceIndicatorUIEnabled } from '../components/global-styles/inheritance';
import { getVariationNameFromClass } from './block-style-variation';
import { store as blockEditorStore } from '../store';

type SourceMap = Record< string, { layer: string } >;

interface StyleSetting {
	label: string;
	// Global Styles paths the setting writes.
	paths: string[];
	// Attributes that hold a preset slug instead of a `style` value.
	presets?: string[];
}

interface BlockAttributes {
	className?: string;
	level?: number;
	style?: Record< string, unknown >;
	[ key: string ]: unknown;
}

/**
 * The style settings a block can set on itself, in the order the inspector
 * shows them.
 *
 * @return Settings with their Global Styles paths.
 */
function getSettings(): StyleSetting[] {
	return [
		{
			label: __( 'Font' ),
			paths: [ 'typography.fontFamily' ],
			presets: [ 'fontFamily' ],
		},
		{
			label: __( 'Size' ),
			paths: [ 'typography.fontSize' ],
			presets: [ 'fontSize' ],
		},
		{
			label: __( 'Appearance' ),
			paths: [ 'typography.fontStyle', 'typography.fontWeight' ],
		},
		{ label: __( 'Line height' ), paths: [ 'typography.lineHeight' ] },
		{
			label: __( 'Letter spacing' ),
			paths: [ 'typography.letterSpacing' ],
		},
		{ label: __( 'Decoration' ), paths: [ 'typography.textDecoration' ] },
		{ label: __( 'Letter case' ), paths: [ 'typography.textTransform' ] },
		{
			label: __( 'Text color' ),
			paths: [ 'color.text' ],
			presets: [ 'textColor' ],
		},
		{
			label: __( 'Background color' ),
			paths: [ 'color.background', 'color.gradient' ],
			presets: [ 'backgroundColor', 'gradient' ],
		},
		{ label: __( 'Link color' ), paths: [ 'elements.link.color' ] },
		{ label: __( 'Background image' ), paths: [ 'background' ] },
		{ label: __( 'Padding' ), paths: [ 'spacing.padding' ] },
		{ label: __( 'Margin' ), paths: [ 'spacing.margin' ] },
		{ label: __( 'Block spacing' ), paths: [ 'spacing.blockGap' ] },
		{ label: __( 'Minimum height' ), paths: [ 'dimensions.minHeight' ] },
		{
			label: __( 'Border' ),
			paths: [ 'border.color', 'border.width', 'border.style' ],
			presets: [ 'borderColor' ],
		},
		{ label: __( 'Radius' ), paths: [ 'border.radius' ] },
		{ label: __( 'Shadow' ), paths: [ 'shadow' ] },
	];
}

// Layers from lowest to highest precedence, matching `resolveStyle`.
const LAYER_ORDER = [ 'root', 'element', 'block', 'blockVariation' ];

function hasValue( value: unknown ): boolean {
	if ( value === undefined || value === null || value === '' ) {
		return false;
	}
	if ( typeof value === 'object' ) {
		return Object.values( value ).some( hasValue );
	}
	return true;
}

/**
 * Whether the block sets a setting itself, through a preset attribute or its
 * `style` attribute.
 *
 * @param attributes Block attributes.
 * @param setting    Entry from `getSettings`.
 * @return Whether the block sets it.
 */
function isSetOnBlock(
	attributes: BlockAttributes | undefined,
	setting: StyleSetting
): boolean {
	if ( setting.presets?.some( ( key ) => attributes?.[ key ] ) ) {
		return true;
	}
	return setting.paths.some( ( path ) =>
		hasValue(
			path
				.split( '.' )
				.reduce< unknown >(
					( node, key ) =>
						node && typeof node === 'object'
							? ( node as Record< string, unknown > )[ key ]
							: undefined,
					attributes?.style
				)
		)
	);
}

/**
 * The highest-precedence Global Styles layer that sets any of the paths. A
 * path also matches the leaves under it (`spacing.padding` matches
 * `spacing.padding.top`).
 *
 * @param sources Source map from `resolveStyle`.
 * @param paths   Global Styles paths.
 * @return Layer name, or `undefined` when Styles sets none of the paths.
 */
function getStylesLayer(
	sources: SourceMap | undefined,
	paths: string[]
): string | undefined {
	let layerIndex = -1;
	for ( const [ key, { layer } ] of Object.entries( sources ?? {} ) ) {
		if (
			paths.some(
				( path ) => key === path || key.startsWith( path + '.' )
			)
		) {
			layerIndex = Math.max( layerIndex, LAYER_ORDER.indexOf( layer ) );
		}
	}
	return LAYER_ORDER[ layerIndex ];
}

/**
 * Names the place in Styles that sets the value the block overrides.
 *
 * @param layer          Layer that sets the value.
 * @param blockTitle     Block title.
 * @param variationLabel Applied block style name, if any.
 * @param element        Highest-precedence element layer, if any.
 * @return Description of the overridden value.
 */
function describeOverride(
	layer: string,
	blockTitle: string,
	variationLabel?: string,
	element?: string
): string {
	if ( layer === 'blockVariation' && variationLabel ) {
		return sprintf(
			/* translators: 1: Block title, e.g. "Button". 2: Block style name, e.g. "Outline". */
			__( 'Overrides the %1$s block’s %2$s style in Styles.' ),
			blockTitle,
			variationLabel
		);
	}
	if ( layer === 'block' ) {
		return sprintf(
			/* translators: %s: Block title, e.g. "Pullquote". */
			__( 'Overrides the %s block in Styles.' ),
			blockTitle
		);
	}
	if ( layer === 'element' && element ) {
		const elementNames: Record< string, string > = {
			button: __( 'Buttons' ),
			link: __( 'Links' ),
			heading: __( 'Headings' ),
		};
		return sprintf(
			/* translators: %s: Element name, e.g. "Buttons" or "Headings". */
			__( 'Overrides %s in Styles.' ),
			elementNames[ element.replace( /^h\d$/, 'heading' ) ] ?? element
		);
	}
	return __( 'Overrides the site’s Styles.' );
}

interface StyleOverridesPanelProps {
	name: string;
	clientId: string;
}

function StyleOverridesPanel( { name, clientId }: StyleOverridesPanelProps ) {
	const blockEditingMode = useBlockEditingMode();
	const instanceId = useInstanceId( StyleOverridesPanel );
	const { attributes, variationLabel, element } = useSelect(
		( select ) => {
			const blockAttributes: BlockAttributes | undefined =
				select( blockEditorStore ).getBlockAttributes( clientId );
			const styles: { name: string; label?: string }[] =
				select( blocksStore ).getBlockStyles( name ) ?? [];
			const variationName = getVariationNameFromClass(
				blockAttributes?.className,
				styles
			);
			const elements: string[] = getElementLayers(
				name,
				getHeadingLevel( name, blockAttributes?.level )
			);
			return {
				attributes: blockAttributes,
				variationLabel: styles.find(
					( style ) => style.name === variationName
				)?.label,
				element: elements[ elements.length - 1 ],
			};
		},
		[ name, clientId ]
	);
	const { sources } = useResolvedStyle( name, attributes?.className );

	const rows = getSettings().filter( ( setting ) =>
		isSetOnBlock( attributes, setting )
	);

	if ( blockEditingMode !== 'default' || ! rows.length ) {
		return null;
	}

	const blockTitle = getBlockType( name )?.title ?? name;
	const headingId = `block-editor-style-overrides__title-${ instanceId }`;

	return (
		<InspectorControls group="advanced">
			<div className="block-editor-style-overrides">
				<h3
					id={ headingId }
					className="block-editor-style-overrides__title"
				>
					{ __( 'Styles set on this block' ) }
				</h3>
				<ul aria-labelledby={ headingId }>
					{ rows.map( ( setting ) => {
						const layer = getStylesLayer( sources, setting.paths );
						return (
							<li
								key={ setting.label }
								className="block-editor-style-overrides__item"
							>
								<span className="block-editor-style-overrides__label">
									{ setting.label }
								</span>
								<span className="block-editor-style-overrides__origin">
									{ layer
										? describeOverride(
												layer,
												blockTitle,
												variationLabel,
												element
											)
										: __( 'Not set in Styles.' ) }
								</span>
							</li>
						);
					} ) }
				</ul>
			</div>
		</InspectorControls>
	);
}

export default {
	edit: StyleOverridesPanel,
	// Re-render when a style attribute changes; the panel reads the
	// attributes from the store itself.
	attributeKeys: [
		'style',
		'className',
		'fontFamily',
		'fontSize',
		'textColor',
		'backgroundColor',
		'gradient',
		'borderColor',
	],
	hasSupport() {
		return isGlobalStylesInheritanceIndicatorUIEnabled();
	},
};
