import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { alignLeft, alignRight, alignCenter } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { AlignmentControl, BlockControls } from '../components';
import { useBlockEditingMode } from '../components/block-editing-mode';
import {
	getStyleForState,
	hasViewportBlockStyleState,
	setStyleForState,
} from './block-style-state';
import { shouldSkipSerialization, useBlockSettings } from './utils';
import { TYPOGRAPHY_SUPPORT_KEY } from './typography';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import type {
	BlockStyleState,
	BlockWrapperProps,
	TextAlignAttributes,
	TextAlignEditProps,
	TextAlignStyle,
} from './types';

export const TEXT_ALIGN_SUPPORT_KEY = 'typography.textAlign';

const TEXT_ALIGNMENT_OPTIONS = [
	{
		icon: alignLeft,
		title: __( 'Align text left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align text center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align text right' ),
		align: 'right',
	},
];

const VALID_TEXT_ALIGNMENTS = [ 'left', 'center', 'right' ];
const NO_TEXT_ALIGNMENTS: string[] = [];

/**
 * Returns the valid text alignments.
 * Takes into consideration the text aligns supported by a block.
 * Exported just for testing purposes, not exported outside the module.
 *
 * @param blockTextAlign Text aligns supported by the block.
 *
 * @return Valid text alignments.
 */
export function getValidTextAlignments(
	blockTextAlign?: boolean | string[] | null
): string[] {
	if ( Array.isArray( blockTextAlign ) ) {
		return VALID_TEXT_ALIGNMENTS.filter( ( textAlign ) =>
			blockTextAlign.includes( textAlign )
		);
	}

	return blockTextAlign === true ? VALID_TEXT_ALIGNMENTS : NO_TEXT_ALIGNMENTS;
}

export function getTextAlignControlGroup(
	isResponsiveEditing: boolean,
	selectedState: BlockStyleState | undefined
) {
	return isResponsiveEditing && hasViewportBlockStyleState( selectedState )
		? 'style-state'
		: 'block';
}

function BlockEditTextAlignmentToolbarControlsPure( {
	clientId,
	style,
	name: blockName,
	setAttributes,
}: TextAlignEditProps ) {
	const settings = useBlockSettings( blockName );
	const hasTextAlignControl = settings?.typography?.textAlign;
	const blockEditingMode = useBlockEditingMode();
	const { selectedState, isResponsiveEditing } = useSelect(
		( select ) => {
			const {
				getSelectedBlockStyleState,
				isResponsiveEditing: getIsResponsiveEditing,
			} = unlock( select( blockEditorStore ) );
			return {
				selectedState: getSelectedBlockStyleState( clientId ),
				isResponsiveEditing: getIsResponsiveEditing(),
			};
		},
		[ clientId ]
	);

	if ( ! hasTextAlignControl || blockEditingMode !== 'default' ) {
		return null;
	}

	const validTextAlignments = getValidTextAlignments(
		// The support is a boolean or a list of alignments.
		getBlockSupport( blockName, TEXT_ALIGN_SUPPORT_KEY ) as
			boolean | string[] | undefined
	);
	if ( ! validTextAlignments.length ) {
		return null;
	}

	const textAlignmentControls = TEXT_ALIGNMENT_OPTIONS.filter( ( control ) =>
		validTextAlignments.includes( control.align )
	);
	// The style attribute holds the text alignment.
	const stateStyle = getStyleForState( style, selectedState ) as
		TextAlignStyle | undefined;
	const controlsGroup = getTextAlignControlGroup(
		isResponsiveEditing,
		selectedState
	);

	const onChange = ( newTextAlignValue?: string ) => {
		const newStateStyle = {
			...stateStyle,
			typography: {
				...stateStyle?.typography,
				textAlign: newTextAlignValue,
			},
		};

		setAttributes( {
			style: setStyleForState( style, selectedState, newStateStyle ),
		} );
	};

	return (
		<BlockControls group={ controlsGroup }>
			<AlignmentControl
				value={ stateStyle?.typography?.textAlign }
				onChange={ onChange }
				alignmentControls={ textAlignmentControls }
			/>
		</BlockControls>
	);
}

export default {
	edit: BlockEditTextAlignmentToolbarControlsPure,
	useBlockProps,
	addSaveProps: addAssignedTextAlign,
	attributeKeys: [ 'style' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, TEXT_ALIGN_SUPPORT_KEY, false );
	},
};

function useBlockProps( {
	name,
	style,
}: {
	name: string;
	style?: TextAlignStyle;
} ) {
	if ( ! style?.typography?.textAlign ) {
		return null;
	}

	const validTextAlignments = getValidTextAlignments(
		// The support is a boolean or a list of alignments.
		getBlockSupport( name, TEXT_ALIGN_SUPPORT_KEY ) as
			boolean | string[] | undefined
	);

	if ( ! validTextAlignments.length ) {
		return null;
	}

	if (
		shouldSkipSerialization( name, TYPOGRAPHY_SUPPORT_KEY, 'textAlign' )
	) {
		return null;
	}

	const textAlign = style.typography.textAlign;

	const className = clsx( {
		[ `has-text-align-${ textAlign }` ]: textAlign,
	} );
	return { className };
}

/**
 * Override props assigned to save component to inject text alignment class
 * name if block supports it.
 *
 * @param props      Additional props applied to save element.
 * @param blockType  Block type.
 * @param attributes Block attributes.
 *
 * @return Filtered props applied to save element.
 */
export function addAssignedTextAlign(
	props: BlockWrapperProps,
	blockType: BlockType | string,
	attributes: TextAlignAttributes
): BlockWrapperProps {
	if ( ! attributes?.style?.typography?.textAlign ) {
		return props;
	}

	const { textAlign } = attributes.style.typography;
	// The support is a boolean or a list of alignments.
	const blockTextAlign = getBlockSupport(
		blockType,
		TEXT_ALIGN_SUPPORT_KEY
	) as boolean | string[] | undefined;
	const isTextAlignValid =
		getValidTextAlignments( blockTextAlign ).includes( textAlign );
	if (
		isTextAlignValid &&
		! shouldSkipSerialization(
			blockType,
			TYPOGRAPHY_SUPPORT_KEY,
			'textAlign'
		)
	) {
		props.className = clsx(
			`has-text-align-${ textAlign }`,
			props.className
		);
	}
	return props;
}
