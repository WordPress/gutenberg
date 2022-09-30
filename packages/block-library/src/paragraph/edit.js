/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __, _x, isRTL } from '@wordpress/i18n';
import {
	ToolbarButton,
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	useSetting,
	__experimentalUseOnBlockDrop as useOnBlockDrop,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	useMergeRefs,
	__experimentalUseDropZone as useDropZone,
} from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { formatLtr } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useOnEnter } from './use-enter';
import DropZone from './drop-zone';

const name = 'core/paragraph';

function ParagraphRTLControl( { direction, setDirection } ) {
	return (
		isRTL() && (
			<ToolbarButton
				icon={ formatLtr }
				title={ _x( 'Left to right', 'editor button' ) }
				isActive={ direction === 'ltr' }
				onClick={ () => {
					setDirection( direction === 'ltr' ? undefined : 'ltr' );
				} }
			/>
		)
	);
}

function hasDropCapDisabled( align ) {
	return align === ( isRTL() ? 'left' : 'right' ) || align === 'center';
}

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
	clientId,
} ) {
	const { align, content, direction, dropCap, placeholder } = attributes;
	const isDropCapFeatureEnabled = useSetting( 'typography.dropCap' );
	const [ paragraphElement, setParagraphElement ] = useState( null );
	const [ isDropZoneVisible, setIsDropZoneVisible ] = useState( false );
	const { rootClientId, blockIndex } = useSelect(
		( select ) => {
			const selectors = select( blockEditorStore );
			return {
				rootClientId: selectors.getBlockRootClientId( clientId ),
				blockIndex: selectors.getBlockIndex( clientId ),
			};
		},
		[ clientId ]
	);
	const onBlockDrop = useOnBlockDrop( rootClientId, blockIndex, {
		action: 'replace',
	} );
	const dragEventsRef = useDropZone( {
		onDrop: onBlockDrop,
		onDragEnter() {
			setIsDropZoneVisible( true );
		},
		onDragLeave() {
			setIsDropZoneVisible( false );
		},
	} );
	const blockProps = useBlockProps( {
		ref: useMergeRefs( [
			useOnEnter( { clientId, content } ),
			setParagraphElement,
			dragEventsRef,
		] ),
		className: classnames( {
			'has-drop-cap': hasDropCapDisabled( align ) ? false : dropCap,
			[ `has-text-align-${ align }` ]: align,
		} ),
		style: { direction },
	} );

	let helpText;
	if ( hasDropCapDisabled( align ) ) {
		helpText = __( 'Not available for aligned text.' );
	} else if ( dropCap ) {
		helpText = __( 'Showing large initial letter.' );
	} else {
		helpText = __( 'Toggle to show a large initial letter.' );
	}

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ align }
					onChange={ ( newAlign ) =>
						setAttributes( {
							align: newAlign,
							dropCap: hasDropCapDisabled( newAlign )
								? false
								: dropCap,
						} )
					}
				/>
				<ParagraphRTLControl
					direction={ direction }
					setDirection={ ( newDirection ) =>
						setAttributes( { direction: newDirection } )
					}
				/>
			</BlockControls>
			{ isDropCapFeatureEnabled && (
				<InspectorControls __experimentalGroup="typography">
					<ToolsPanelItem
						hasValue={ () => !! dropCap }
						label={ __( 'Drop cap' ) }
						onDeselect={ () =>
							setAttributes( { dropCap: undefined } )
						}
						resetAllFilter={ () => ( { dropCap: undefined } ) }
						panelId={ clientId }
					>
						<ToggleControl
							label={ __( 'Drop cap' ) }
							checked={ !! dropCap }
							onChange={ () =>
								setAttributes( { dropCap: ! dropCap } )
							}
							help={ helpText }
							disabled={
								hasDropCapDisabled( align ) ? true : false
							}
						/>
					</ToolsPanelItem>
				</InspectorControls>
			) }
			<AnimatePresence>
				{ ! content && isDropZoneVisible && (
					<DropZone
						key="empty-paragraph-drop-zone"
						paragraphElement={ paragraphElement }
					/>
				) }
			</AnimatePresence>
			<RichText
				identifier="content"
				tagName="p"
				{ ...blockProps }
				value={ content }
				onChange={ ( newContent ) =>
					setAttributes( { content: newContent } )
				}
				onSplit={ ( value, isOriginal ) => {
					let newAttributes;

					if ( isOriginal || value ) {
						newAttributes = {
							...attributes,
							content: value,
						};
					}

					const block = createBlock( name, newAttributes );

					if ( isOriginal ) {
						block.clientId = clientId;
					}

					return block;
				} }
				onMerge={ mergeBlocks }
				onReplace={ onReplace }
				onRemove={ onRemove }
				aria-label={
					content
						? __( 'Paragraph block' )
						: __(
								'Empty block; start writing or type forward slash to choose a block'
						  )
				}
				data-empty={ content ? false : true }
				placeholder={ placeholder || __( 'Type / to choose a block' ) }
				data-custom-placeholder={ placeholder ? true : undefined }
				__unstableEmbedURLOnPaste
				__unstableAllowPrefixTransformations
			/>
		</>
	);
}

export default ParagraphBlock;
