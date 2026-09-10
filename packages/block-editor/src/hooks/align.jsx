import clsx from 'clsx';
import { addFilter } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import { BlockControls, BlockAlignmentControl } from '../components';
import useAvailableAlignments, {
	useAlignmentMenu,
} from '../components/block-alignment-control/use-available-alignments';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { store as blockEditorStore } from '../store';
import useBlockDisplayInformation from '../components/use-block-display-information';

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
 * @param {?boolean|string[]} blockAlign          Aligns supported by the block.
 * @param {?boolean}          hasWideBlockSupport True if block supports wide alignments. And False otherwise.
 * @param {?boolean}          hasWideEnabled      True if theme supports wide alignments. And False otherwise.
 *
 * @return {string[]} Valid alignments.
 */
export function getValidAlignments(
	blockAlign,
	hasWideBlockSupport = true,
	hasWideEnabled = true
) {
	let validAlignments;
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
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
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
 * @param {string} clientId The block whose alignments are withheld.
 *
 * @return {?{description: string, action: Object}} The constraint.
 */
function useAlignmentConstraint( clientId ) {
	const parentClientId = useSelect(
		( select ) => {
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
		[ clientId ]
	);

	const parentInfo = useBlockDisplayInformation( parentClientId );
	const { selectBlock } = useDispatch( blockEditorStore );

	if ( ! parentInfo ) {
		return null;
	}

	/*
	 * The block type rather than any name it has been given, matching how
	 * `BlockParentSelector` labels the same action. The icon comes from the
	 * type too, so the two can never describe different blocks — a custom name
	 * can sit beside an icon that does not look like it.
	 */
	const parentTitle = parentInfo.title;

	return {
		/*
		 * The label above already names the block, so this only has to say what
		 * about it is doing the limiting. "Layout" is also where the setting
		 * lives once they get there.
		 */
		description: __( 'Its layout limits widths' ),
		action: {
			label: sprintf(
				// translators: %s: title of the containing block, e.g. "Group".
				__( 'Select %s' ),
				parentTitle
			),
			/*
			 * The block's own icon, matching how `BlockParentSelector` renders
			 * the same "go up a level" action in the toolbar. It also keeps the
			 * item in the menu's icon column.
			 */
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
} ) {
	// Compute the block valid alignments by taking into account,
	// if the theme supports wide alignments or not and the layout's
	// available alignments. We do that for conditionally rendering
	// Slot.
	const blockAllowedAlignments = getValidAlignments(
		getBlockSupport( blockName, 'align' ),
		hasBlockSupport( blockName, 'alignWide', true )
	);

	const { enabled, unavailable } = useAlignmentMenu( blockAllowedAlignments );
	const constraint = useAlignmentConstraint( clientId );
	const blockEditingMode = useBlockEditingMode();
	/*
	 * Render whenever there is something to say, which includes having only
	 * unavailable alignments to report: a Group supports nothing but wide and
	 * full, so in a layout offering neither the control would otherwise vanish
	 * from the block most likely to want them.
	 */
	if (
		( ! enabled.length && ! unavailable.length ) ||
		blockEditingMode !== 'default'
	) {
		return null;
	}

	const updateAlignment = ( nextAlign ) => {
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
				constraint={ unavailable.length ? constraint : undefined }
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
	hasSupport( name ) {
		return hasBlockSupport( name, 'align', false );
	},
};

function useBlockProps( { name, align } ) {
	const blockAllowedAlignments = getValidAlignments(
		getBlockSupport( name, 'align' ),
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
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addAssignedAlign( props, blockType, attributes ) {
	const { align } = attributes;
	const blockAlign = getBlockSupport( blockType, 'align' );
	const hasWideBlockSupport = hasBlockSupport( blockType, 'alignWide', true );

	// Compute valid alignments without taking into account if
	// the theme supports wide alignments or not.
	// This way changing themes does not impact the block save.
	const isAlignValid = getValidAlignments(
		blockAlign,
		hasWideBlockSupport
	).includes( align );
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
