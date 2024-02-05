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
	useSettings,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { formatLtr } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useOnEnter } from './use-enter';

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

function DropCapControl( { clientId, attributes, setAttributes } ) {
	// Please do not add a useSelect call to the paragraph block unconditionally.
	// Every useSelect added to a (frequently used) block will degrade load
	// and type performance. By moving it within InspectorControls, the subscription is
	// now only added for the selected block(s).
	const [ isDropCapFeatureEnabled ] = useSettings( 'typography.dropCap' );

	if ( ! isDropCapFeatureEnabled ) {
		return null;
	}

	const { align, dropCap } = attributes;

	let helpText;
	if ( hasDropCapDisabled( align ) ) {
		helpText = __( 'Not available for aligned text.' );
	} else if ( dropCap ) {
		helpText = __( 'Showing large initial letter.' );
	} else {
		helpText = __( 'Toggle to show a large initial letter.' );
	}

	return (
		<ToolsPanelItem
			hasValue={ () => !! dropCap }
			label={ __( 'Drop cap' ) }
			onDeselect={ () => setAttributes( { dropCap: undefined } ) }
			resetAllFilter={ () => ( { dropCap: undefined } ) }
			panelId={ clientId }
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Drop cap' ) }
				checked={ !! dropCap }
				onChange={ () => setAttributes( { dropCap: ! dropCap } ) }
				help={ helpText }
				disabled={ hasDropCapDisabled( align ) ? true : false }
			/>
		</ToolsPanelItem>
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
	const { align, content, direction, dropCap, placeholder } = attributes;
	const blockProps = useBlockProps( {
		ref: useOnEnter( { clientId, content } ),
		className: classnames( {
			'has-drop-cap': hasDropCapDisabled( align ) ? false : dropCap,
			[ `has-text-align-${ align }` ]: align,
		} ),
		style: { direction },
	} );
	const blockEditingMode = useBlockEditingMode();

	return (
		<>
			{ blockEditingMode === 'default' && (
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
			) }
			<InspectorControls group="typography">
				<DropCapControl
					clientId={ clientId }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
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
					RichText.isEmpty( content )
						? __(
								'Empty block; start writing or type forward slash to choose a block'
						  )
						: __( 'Block: Paragraph' )
				}
				data-empty={ RichText.isEmpty( content ) }
				placeholder={ placeholder || __( 'Type / to choose a block' ) }
				data-custom-placeholder={ placeholder ? true : undefined }
				__unstableEmbedURLOnPaste
				__unstableAllowPrefixTransformations
			/>
		</>
	);
}

export default ParagraphBlock;
