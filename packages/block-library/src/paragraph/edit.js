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
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	useSettings,
	useBlockEditingMode,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { getBlockSupport } from '@wordpress/blocks';
import { formatLTR } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { useOnEnter } from './use-enter';
import useDeprecatedAlign from './deprecated-attributes';

function ParagraphRTLControl( { direction, setDirection } ) {
	return (
		isRTL() && (
			<ToolbarButton
				icon={ formatLTR }
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

function RichTextWrapper( { clientId, blockEditingMode, children } ) {
	// This wrapper checks whether the slash inserter is available in the current
	// context and passes the result to children to dynamically adjust the
	// placeholder text.
	// Please do not add a useSelect call to the paragraph block unconditionally.
	// Every useSelect added to a (frequently used) block will degrade load and
	// type performance. This wrapper is only rendered when the block is selected
	// or empty, keeping the store subscription cost minimal.
	const isOnlyParagraphAllowed = useSelect(
		( select ) => {
			const { getBlockRootClientId, getInserterItems } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			const items = getInserterItems( rootClientId );
			return items.length === 1 && items[ 0 ].name === 'core/paragraph';
		},
		[ clientId ]
	);

	const isSlashInserterDisabled =
		blockEditingMode === 'contentOnly' || isOnlyParagraphAllowed;

	return children( isSlashInserterDisabled );
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
	useDeprecatedAlign( attributes.align, style, setAttributes );
	const blockProps = useBlockProps( {
		ref: useOnEnter( { clientId, content } ),
		className: clsx( {
			'has-drop-cap': hasDropCapDisabled( textAlign ) ? false : dropCap,
		} ),
		style: { direction },
	} );
	const blockEditingMode = useBlockEditingMode();

	const richTextProps = {
		identifier: 'content',
		tagName: 'p',
		...blockProps,
		value: content,
		onChange: ( newContent ) => setAttributes( { content: newContent } ),
		onMerge: mergeBlocks,
		onReplace,
		onRemove,
		'data-empty': RichText.isEmpty( content ),
		'data-custom-placeholder': placeholder ? true : undefined,
		__unstableEmbedURLOnPaste: true,
		__unstableAllowPrefixTransformations: true,
	};

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
			{ isSingleSelected || RichText.isEmpty( content ) ? (
				<RichTextWrapper
					clientId={ clientId }
					blockEditingMode={ blockEditingMode }
				>
					{ ( isSlashInserterDisabled ) => {
						let ariaLabel;
						if ( ! RichText.isEmpty( content ) ) {
							ariaLabel = __( 'Block: Paragraph' );
						} else if ( isSlashInserterDisabled ) {
							ariaLabel = __( 'Empty block; start writing' );
						} else {
							ariaLabel = __(
								'Empty block; start writing or type forward slash to choose a block'
							);
						}
						return (
							<RichText
								{ ...richTextProps }
								aria-label={ ariaLabel }
								placeholder={
									placeholder ||
									( isSlashInserterDisabled
										? __( 'Start writing…' )
										: __( 'Type / to choose a block' ) )
								}
							/>
						);
					} }
				</RichTextWrapper>
			) : (
				<RichText
					{ ...richTextProps }
					aria-label={
						RichText.isEmpty( content )
							? __(
									'Empty block; start writing or type forward slash to choose a block'
							  )
							: __( 'Block: Paragraph' )
					}
					placeholder={
						placeholder || __( 'Type / to choose a block' )
					}
				/>
			) }
		</>
	);
}

export default ParagraphBlock;
