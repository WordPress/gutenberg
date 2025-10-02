/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import InspectorControls from '../inspector-controls';
import { useBorderPanelLabel } from '../../hooks/border';
import { useBlockSettings } from '../../hooks/utils';
import { store as blockEditorStore } from '../../store';
import { ColorEdit } from '../../hooks/color';
import { ColorToolsPanel } from '../global-styles/color-panel';

function SectionBlockControls( { blockName, clientId, contentClientIds } ) {
	const settings = useBlockSettings( blockName );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const [ defaultControls, setDefaultControls ] = useState( {
		text: true,
		background: true,
		button: true,
		heading: true,
		caption: true,
		link: true,
	} );

	const contentBlocks = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );

			// Get only the content-exposed blocks
			return contentClientIds
				? contentClientIds
						.map( ( id ) => getBlock( id ) )
						.filter( Boolean )
				: [];
		},
		[ contentClientIds ]
	);

	useEffect( () => {
		let hasButton = false;
		let hasHeading = false;
		let hasCaption = false;
		let hasLink = false;

		for ( const block of contentBlocks ) {
			// Check for button blocks
			if ( block.name === 'core/button' ) {
				hasButton = true;
			}
			// Check for heading blocks
			if ( block.name === 'core/heading' ) {
				hasHeading = true;
			}

			// Check for actual caption content
			if (
				block.name === 'core/image' ||
				block.name === 'core/video' ||
				block.name === 'core/audio' ||
				block.name === 'core/gallery'
			) {
				const caption = block.attributes?.caption;
				// Caption can be a string, array, or rich-text object
				const hasCaptionContent =
					caption &&
					( ( typeof caption === 'string' &&
						caption.trim() !== '' ) ||
						( Array.isArray( caption ) && caption.length > 0 ) ||
						( typeof caption === 'object' &&
							caption.text &&
							caption.text.trim() !== '' ) );
				if ( hasCaptionContent ) {
					hasCaption = true;
				}
			}

			// Check for actual link content
			let blockHasLink = false;

			if ( block.name === 'core/paragraph' ) {
				// Check if paragraph content contains anchor tags
				blockHasLink =
					block.attributes?.content &&
					block.attributes.content.includes( '<a ' );
			} else if ( block.name === 'core/heading' ) {
				// Check if heading content contains anchor tags
				blockHasLink =
					block.attributes?.content &&
					block.attributes.content.includes( '<a ' );
			} else if ( block.name === 'core/button' ) {
				// Buttons always have links
				blockHasLink = !! block.attributes?.url;
			}

			if ( blockHasLink ) {
				hasLink = true;
			}
		}

		setDefaultControls( {
			text: true,
			background: true,
			button: hasButton,
			heading: hasHeading,
			caption: hasCaption,
			link: hasLink,
		} );
	}, [ contentBlocks ] );

	const setAttributes = ( newAttributes ) => {
		updateBlockAttributes( clientId, newAttributes );
	};

	return (
		<ColorEdit
			clientId={ clientId }
			name={ blockName }
			settings={ settings }
			setAttributes={ setAttributes }
			asWrapper={ ColorToolsPanel }
			label={ __( 'Color' ) }
			defaultControls={ defaultControls }
		/>
	);
}

const StylesTab = ( {
	blockName,
	clientId,
	hasBlockStyles,
	isSectionBlock,
	contentClientIds,
} ) => {
	const borderPanelLabel = useBorderPanelLabel( { blockName } );

	return (
		<>
			{ hasBlockStyles && (
				<div>
					<PanelBody title={ __( 'Styles' ) }>
						<BlockStyles clientId={ clientId } />
					</PanelBody>
				</div>
			) }
			{ isSectionBlock && (
				<SectionBlockControls
					blockName={ blockName }
					clientId={ clientId }
					contentClientIds={ contentClientIds }
				/>
			) }
			{ ! isSectionBlock && (
				<>
					<InspectorControls.Slot
						group="color"
						label={ __( 'Color' ) }
						className="color-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot
						group="background"
						label={ __( 'Background image' ) }
					/>
					<InspectorControls.Slot group="filter" />
					<InspectorControls.Slot
						group="typography"
						label={ __( 'Typography' ) }
					/>
					<InspectorControls.Slot
						group="dimensions"
						label={ __( 'Dimensions' ) }
					/>
					<InspectorControls.Slot
						group="border"
						label={ borderPanelLabel }
					/>
					<InspectorControls.Slot group="styles" />
				</>
			) }
		</>
	);
};

export default StylesTab;
