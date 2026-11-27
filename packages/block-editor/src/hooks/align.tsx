import clsx from 'clsx';
import { addFilter } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { BlockControls, BlockAlignmentControl } from '../components';
import useAvailableAlignments, {
	useAlignmentMenu,
} from '../components/block-alignment-control/use-available-alignments';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { store as blockEditorStore } from '../store';
import useBlockDisplayInformation from '../components/use-block-display-information';
import type { BlockAlignmentConstraint } from '../components/block-alignment-control/types';
import type {
	AlignAttributes,
	AlignEditProps,
	AlignSupport,
	BlockListBlockFeatureProps,
	BlockWrapperProps,
} from './types';

/**
 * An array which includes all possible valid alignments,
 * used to validate if an alignment is valid or not.
 *
 * @constant
 * @type {string[]}
 */
const ALL_ALIGNMENTS = [ 'left', 'center', 'right', 'wide', 'full' ];

/**
 * An array which includes all wide alignments.
 * In order for this alignments to be valid they need to be supported by the block,
 * and by the theme.
 *
 * @constant
 * @type {string[]}
 */
const WIDE_ALIGNMENTS = [ 'wide', 'full' ];

/**
 * Returns the valid alignments.
 * Takes into consideration the aligns supported by a block, if the block supports wide controls or not and if theme supports wide controls or not.
 * Exported just for testing purposes, not exported outside the module.
 *
 * @param blockAlign          Aligns supported by the block.
 * @param hasWideBlockSupport True if block supports wide alignments. And False otherwise.
 * @param hasWideEnabled      True if theme supports wide alignments. And False otherwise.
 *
 * @return Valid alignments.
 */
export function getValidAlignments(
	blockAlign?: boolean | string[] | null,
	hasWideBlockSupport: boolean | null = true,
	hasWideEnabled: boolean | null = true
): string[] {
	let validAlignments: string[];
	if ( Array.isArray( blockAlign ) ) {
		validAlignments = ALL_ALIGNMENTS.filter( ( value ) =>
			blockAlign.includes( value )
		);
	} else if ( blockAlign === true ) {
		// `true` includes all alignments...
		validAlignments = [ ...ALL_ALIGNMENTS ];
	} else {
		validAlignments = [];
	}

	if (
		! hasWideEnabled ||
		( blockAlign === true && ! hasWideBlockSupport )
	) {
		return validAlignments.filter(
			( alignment ) => ! WIDE_ALIGNMENTS.includes( alignment )
		);
	}

	return validAlignments;
}

/**
 * Filters registered block settings, extending attributes to include `align`.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
export function addAttribute( settings: BlockType ): BlockType {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( 'type' in ( settings.attributes?.align ?? {} ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'align' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			align: {
				type: 'string',
				// Allow for '' since it is used by the `updateAlignment` function
				// in toolbar controls for special cases with defined default values.
				enum: [ ...ALL_ALIGNMENTS, '' ],
			},
		};
	}

	return settings;
}

/**
 * Describes the block whose layout is withholding alignments, so the menu can
 * name it and offer to select it.
 *
 * Only a block the user can reach from here is described. When the constraint
 * comes from outside the post — the template wrapped around the content — there
 * is no block on the page to send anyone to.
 *
 * @param clientId   The block whose alignments are withheld.
 * @param isRequired Whether any alignments are withheld. When false, the parent is not looked up.
 *
 * @return What is limiting the width, or `undefined` when nothing reachable is.
 */
function useAlignmentConstraint(
	clientId: string,
	isRequired: boolean
): BlockAlignmentConstraint | undefined {
	const parentClientId = useSelect(
		( select ) => {
			if ( ! isRequired ) {
				return null;
			}

			const { getBlockRootClientId, getBlockEditingMode } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );

			if (
				! rootClientId ||
				getBlockEditingMode( rootClientId ) !== 'default'
			) {
				return null;
			}

			return rootClientId;
		},
		[ clientId, isRequired ]
	);

	const parentInfo = useBlockDisplayInformation( parentClientId ?? '' );
	const { selectBlock } = useDispatch( blockEditorStore );

	if ( ! parentClientId || ! parentInfo ) {
		return undefined;
	}

	return {
		/*
		 * The label beside this already names the block, so the description only
		 * has to say what about it is doing the limiting. "Layout" is also where
		 * the setting lives once they get there.
		 */
		description: __( 'Its layout limits widths' ),
		action: {
			/*
			 * The block type rather than any name it has been given, matching how
			 * `BlockParentSelector` labels the same action. The icon comes from
			 * the type too, so the two can never describe different blocks — a
			 * custom name can sit beside an icon that does not look like it.
			 */
			label: sprintf(
				// translators: %s: title of the containing block, e.g. "Group".
				__( 'Select %s' ),
				parentInfo.title
			),
			icon: parentInfo.icon,
			onClick: () => selectBlock( parentClientId ),
		},
	};
}

function BlockEditAlignmentToolbarControlsPure( {
	name: blockName,
	align,
	clientId,
	setAttributes,
}: AlignEditProps ) {
	// Compute the block valid alignments by taking into account,
	// if the theme supports wide alignments or not and the layout's
	// available alignments. We do that for conditionally rendering
	// Slot.
	const blockAllowedAlignments = getValidAlignments(
		// The `align` support is a boolean or a list of alignments.
		getBlockSupport( blockName, 'align' ) as AlignSupport,
		hasBlockSupport( blockName, 'alignWide', true )
	);

	const { enabled, unavailable } = useAlignmentMenu( blockAllowedAlignments );
	const blockEditingMode = useBlockEditingMode();
	/*
	 * Only render when some alignment actually works. Many blocks — Paragraph,
	 * Heading, List, Group among them — support nothing but wide and full, so
	 * in a layout offering neither, a control made only of unavailable options
	 * would sit on the toolbar unable to change anything.
	 */
	const isRendered = enabled.length > 0 && blockEditingMode === 'default';
	const constraint = useAlignmentConstraint(
		clientId,
		isRendered && unavailable.length > 0
	);

	if ( ! isRendered ) {
		return null;
	}

	const updateAlignment = ( nextAlign: string | undefined ) => {
		if ( ! nextAlign ) {
			const blockType = getBlockType( blockName );
			const blockDefaultAlign = blockType?.attributes?.align?.default;
			if ( blockDefaultAlign ) {
				nextAlign = '';
			}
		}
		setAttributes( { align: nextAlign } );
	};

	return (
		<BlockControls group="block" __experimentalShareWithChildBlocks>
			<BlockAlignmentControl
				value={ align }
				onChange={ updateAlignment }
				/*
				 * Pass the alignments the block itself supports rather than the
				 * ones the current layout leaves available. The control filters
				 * them again, but keeping the unfiltered list lets it tell the
				 * difference between an alignment this block never had and one a
				 * parent layout has taken away.
				 */
				controls={ blockAllowedAlignments }
				constraint={ constraint }
			/>
		</BlockControls>
	);
}

export default {
	shareWithChildBlocks: true,
	edit: BlockEditAlignmentToolbarControlsPure,
	useBlockProps,
	addSaveProps: addAssignedAlign,
	attributeKeys: [ 'align' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, 'align', false );
	},
};

function useBlockProps( { name, align }: BlockListBlockFeatureProps ) {
	const blockAllowedAlignments = getValidAlignments(
		// The `align` support is a boolean or a list of alignments.
		getBlockSupport( name, 'align' ) as AlignSupport,
		hasBlockSupport( name, 'alignWide', true )
	);
	const validAlignments = useAvailableAlignments( blockAllowedAlignments );

	if ( validAlignments.some( ( alignment ) => alignment.name === align ) ) {
		return { 'data-align': align };
	}

	return {};
}

/**
 * Override props assigned to save component to inject alignment class name if
 * block supports it.
 *
 * @param props      Additional props applied to save element.
 * @param blockType  Block type.
 * @param attributes Block attributes.
 *
 * @return Filtered props applied to save element.
 */
export function addAssignedAlign(
	props: BlockWrapperProps,
	blockType: BlockType | string,
	attributes: AlignAttributes
): BlockWrapperProps {
	const { align } = attributes;
	// The `align` support is a boolean or a list of alignments.
	const blockAlign = getBlockSupport( blockType, 'align' ) as AlignSupport;
	const hasWideBlockSupport = hasBlockSupport( blockType, 'alignWide', true );

	// Compute valid alignments without taking into account if
	// the theme supports wide alignments or not.
	// This way changing themes does not impact the block save.
	const isAlignValid = getValidAlignments(
		blockAlign,
		hasWideBlockSupport
		// An unset alignment is never valid.
	).includes( align as string );
	if ( isAlignValid ) {
		props.className = clsx( `align${ align }`, props.className );
	}

	return props;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/align/addAttribute',
	addAttribute
);
