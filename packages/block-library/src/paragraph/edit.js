/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, isRTL } from '@wordpress/i18n';
import {
	ToolbarButton,
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	useSetting,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { formatLtr } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useOnEnter } from './use-enter';
import { useSelect } from '@wordpress/data';

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

// function useAttributes( name ) {
// 	return useSelect(
// 		( select ) => select( blockEditorStore ).getAttribute( name ),
// 		[ name ]
// 	);
// }

function BlockContent( {
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
	clientId,
	blockProps,
} ) {
	const content = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId ).content,
		[ clientId ]
	);
	const { placeholder } = attributes;
	return (
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
	);
}

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
	clientId,
} ) {
	const { align, direction, dropCap } = attributes;
	const isDropCapFeatureEnabled = useSetting( 'typography.dropCap' );

	let helpText;
	if ( hasDropCapDisabled( align ) ) {
		helpText = __( 'Not available for aligned text.' );
	} else if ( dropCap ) {
		helpText = __( 'Showing large initial letter.' );
	} else {
		helpText = __( 'Toggle to show a large initial letter.' );
	}

	const blockProps = useBlockProps( {
		ref: useOnEnter( { clientId } ),
		className: classnames( {
			'has-drop-cap': hasDropCapDisabled( align ) ? false : dropCap,
			[ `has-text-align-${ align }` ]: align,
		} ),
		style: { direction },
	} );

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
				<InspectorControls group="typography">
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
			<BlockContent
				attributes={ attributes }
				mergeBlocks={ mergeBlocks }
				onReplace={ onReplace }
				onRemove={ onRemove }
				setAttributes={ setAttributes }
				clientId={ clientId }
				blockProps={ blockProps }
			/>
		</>
	);
}

export default ParagraphBlock;
