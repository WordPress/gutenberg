/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, isRTL } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	Popover,
	SearchControl,
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
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { plugins as pluginsIcon, formatLtr } from '@wordpress/icons';

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

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
	clientId,
} ) {
	const { align, content, direction, dropCap, placeholder } = attributes;
	const [ isDropCapFeatureEnabled ] = useSettings( 'typography.dropCap' );
	const blockProps = useBlockProps( {
		ref: useOnEnter( { clientId, content } ),
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

	// Simulate fetching the REST API.
	const metadata = [
		{
			name: 'Site title',
			key: 'site_title',
			value: 'This is the title of my site',
		},
		{
			name: 'My custom field 1',
			key: 'custom_field_1',
			value: 'Value of my custom field 1',
		},
		{
			name: 'My custom field 2',
			key: 'custom_field_2',
			value: 'Value of my custom field 2',
		},
		{
			name: 'Post title',
			key: 'post_title',
			value: 'This is the post title',
		},
		{
			name: 'Post summary',
			key: 'post_summary',
			value: 'This is the post summary',
		},
	];

	// Adding the elements for the Bindings UI.
	const [ addingBinding, setAddingBinding ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const [ searchInput, setSearchInput ] = useState( '' );
	const [ selectedField, setSelectedField ] = useState( null );

	function selectItem( item ) {
		setSelectedField( item );
		setAttributes( {
			content: item.value,
		} );
		setAddingBinding( false );
	}
	function BindingsUI() {
		return (
			<Popover
				popoverAnchor={ popoverAnchor }
				onClose={ () => {
					setAddingBinding( false );
				} }
				onFocusOutside={ () => {
					setAddingBinding( false );
				} }
				placement="bottom"
				shift
			>
				<SearchControl
					label={ __( 'Search metadata' ) }
					value={ searchInput }
					onChange={ setSearchInput }
					size="compact"
				/>
				<ul className="token-metadata-list">
					{ metadata.map( ( item ) => (
						<li
							key={ item.key }
							onClick={ () => selectItem( item ) }
							className={
								selectedField?.key === item.key
									? 'selected-meta-field'
									: ''
							}
						>
							{ item.name }
						</li>
					) ) }
				</ul>
			</Popover>
		);
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
							__nextHasNoMarginBottom
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
						? __( 'Block: Paragraph' )
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
			<BlockControls group="other">
				<Button
					onClick={ () => {
						setAddingBinding( ! addingBinding );
					} }
					aria-expanded={ true }
					icon={ pluginsIcon }
					ref={ setPopoverAnchor }
				></Button>
				{ addingBinding && <BindingsUI /> }
			</BlockControls>
		</>
	);
}

export default ParagraphBlock;
