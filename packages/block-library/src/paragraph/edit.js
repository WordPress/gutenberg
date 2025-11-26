/**
 * External dependencies
 */
import clsx from 'clsx';

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
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	useSettings,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { getBlockSupport } from '@wordpress/blocks';
import { formatLtr } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { useOnEnter } from './use-enter';

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

function DropCapControl( { clientId, attributes, setAttributes, name } ) {
	// Please do not add a useSelect call to the paragraph block unconditionally.
	// Every useSelect added to a (frequently used) block will degrade load
	// and type performance. By moving it within InspectorControls, the subscription is
	// now only added for the selected block(s).
	const [ isDropCapFeatureEnabled ] = useSettings( 'typography.dropCap' );

	if ( ! isDropCapFeatureEnabled ) {
		return null;
	}

	const { style, dropCap } = attributes;
	const textAlign = style?.typography?.textAlign;

	let helpText;
	if ( hasDropCapDisabled( textAlign ) ) {
		helpText = __( 'Not available for aligned text.' );
	} else if ( dropCap ) {
		helpText = __( 'Showing large initial letter.' );
	} else {
		helpText = __( 'Show a large initial letter.' );
	}

	const isDropCapControlEnabledByDefault = getBlockSupport(
		name,
		'typography.defaultControls.dropCap',
		false
	);

	return (
		<InspectorControls group="typography">
			<ToolsPanelItem
				hasValue={ () => !! dropCap }
				label={ __( 'Drop cap' ) }
				isShownByDefault={ isDropCapControlEnabledByDefault }
				onDeselect={ () => setAttributes( { dropCap: false } ) }
				resetAllFilter={ () => ( { dropCap: false } ) }
				panelId={ clientId }
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Drop cap' ) }
					checked={ !! dropCap }
					onChange={ () => setAttributes( { dropCap: ! dropCap } ) }
					help={ helpText }
					disabled={ hasDropCapDisabled( textAlign ) }
				/>
			</ToolsPanelItem>
		</InspectorControls>
	);
}

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
	clientId,
	isSelected: isSingleSelected,
	name,
} ) {
	const { content, direction, dropCap, placeholder, style } = attributes;
	const textAlign = style?.typography?.textAlign;
	const blockProps = useBlockProps( {
		ref: useOnEnter( { clientId, content } ),
		className: clsx( {
			'has-drop-cap': hasDropCapDisabled( textAlign ) ? false : dropCap,
		} ),
		style: { direction },
	} );
	const blockEditingMode = useBlockEditingMode();

	return (
		<>
			{ blockEditingMode === 'default' && (
				<BlockControls group="block">
					<ParagraphRTLControl
						direction={ direction }
						setDirection={ ( newDirection ) =>
							setAttributes( { direction: newDirection } )
						}
					/>
				</BlockControls>
			) }
			{ isSingleSelected && (
				<DropCapControl
					name={ name }
					clientId={ clientId }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			) }
			<RichText
				identifier="content"
				tagName="p"
				{ ...blockProps }
				value={ content }
				onChange={ ( newContent ) =>
					setAttributes( { content: newContent } )
				}
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
