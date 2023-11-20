/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import {
	SelectControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import useDisplayBlockControls from '../components/use-display-block-controls';
import { store as blockEditorStore } from '../store';
import { useBlockEditingMode } from '..';

export const SECTION_SUPPORT_KEY = 'section';

const SECTION_SUPPORTED_BLOCKS = [ 'core/group' ];

function hasSectionSupport( blockType ) {
	return !! getBlockSupport( blockType, SECTION_SUPPORT_KEY );
}

/**
 * Filters the registered block settings, extending attributes to include section.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings ) {
	if ( ! hasSectionSupport( settings ) ) {
		return settings;
	}

	if ( ! settings.attributes.section ) {
		Object.assign( settings.attributes, { section: { type: 'number' } } );
	}

	return settings;
}

/**
 * Determines the section CSS class that should be applied.
 *
 * @param {number} section           Index for the block's selected section style.
 * @param {Array}  availableSections The defined section styles.
 *
 * @return {string|undefined} The section CSS class to be applied.
 */
function getSectionClass( section, availableSections ) {
	if ( ! section || ! availableSections?.length ) {
		return;
	}

	const sectionIndex = Math.min( section, availableSections.length );

	return `wp-section-${ sectionIndex }`;
}

function SectionPanelItem( props ) {
	const { attributes, clientId, setAttributes, sections = [] } = props;

	const sectionOptions = [
		{ value: '', label: __( 'Default' ) },
		...sections.map( ( section, index ) => ( {
			value: index,
			label: section.title, // TODO: Make sure this is translatable in theme.json.
		} ) ),
	];

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			section: undefined,
		};
	}, [] );

	const onChange = ( nextValue ) => {
		setAttributes( {
			section: nextValue !== '' ? nextValue : undefined,
		} );
	};

	return (
		<ToolsPanelItem
			hasValue={ () => !! attributes.section }
			label={ __( 'Section' ) }
			onDeselect={ () => setAttributes( { section: undefined } ) }
			isShownByDefault={ true }
			resetAllFilter={ resetAllFilter }
			panelId={ clientId }
		>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				hideLabelFromVision
				label={ __( 'Section Style' ) }
				value={ attributes.section ?? '' }
				options={ sectionOptions }
				onChange={ onChange }
			/>
		</ToolsPanelItem>
	);
}

const withSectionControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const sections = useSelect( ( select ) => {
			return select( blockEditorStore ).getSettings().__experimentalStyles
				?.sections;
		} );

		// TODO: Add theme.json setting to disable section styling.
		if (
			! SECTION_SUPPORTED_BLOCKS.includes( props.name ) ||
			! hasSectionSupport( props.name ) ||
			! sections?.length
		) {
			return <BlockEdit key="edit" { ...props } />;
		}

		const shouldDisplayControls = useDisplayBlockControls();
		const blockEditingMode = useBlockEditingMode();

		const sectionClass = getSectionClass(
			props.attributes.section,
			sections
		);

		const newClassName =
			classnames( props.className, {
				[ sectionClass ]: !! sectionClass,
			} ) || undefined;

		return (
			<>
				{ shouldDisplayControls && blockEditingMode === 'default' && (
					<InspectorControls group="section">
						<SectionPanelItem { ...props } sections={ sections } />
					</InspectorControls>
				) }
				<BlockEdit key="edit" { ...props } className={ newClassName } />
			</>
		);
	},
	'withSectionControls'
);

addFilter(
	'blocks.registerBlockType',
	'core/section/addAttribute',
	addAttribute
);

addFilter(
	'editor.BlockEdit',
	'core/section/with-section-controls',
	withSectionControls
);
