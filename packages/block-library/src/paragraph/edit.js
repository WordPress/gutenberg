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
import { useDispatch } from '@wordpress/data';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';

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

function ParagrapgShortcuts( { attributes, clientId } ) {
	const { align, content } = attributes;
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	registerShortcut( {
		name: 'core/blocks/paragraph/transform-to-heading-1',
		category: 'block-library',
		description: __( 'Transform to heading.' ),
		keyCombination: {
			modifier: 'access',
			character: '1',
		},
	} );
	useShortcut( 'core/blocks/paragraph/transform-to-heading-1', ( event ) => {
		event.preventDefault();
		replaceBlocks(
			clientId,
			createBlock( 'core/heading', { level: 1, content, align } )
		);
	} );

	registerShortcut( {
		name: 'core/blocks/paragraph/transform-to-heading-2',
		category: 'block-library',
		description: __( 'Transform to heading.' ),
		keyCombination: {
			modifier: 'access',
			character: '2',
		},
	} );
	useShortcut( 'core/blocks/paragraph/transform-to-heading-2', ( event ) => {
		event.preventDefault();
		replaceBlocks(
			clientId,
			createBlock( 'core/heading', { level: 2, content, align } )
		);
	} );

	registerShortcut( {
		name: 'core/blocks/paragraph/transform-to-heading-3',
		category: 'block-library',
		description: __( 'Transform to heading.' ),
		keyCombination: {
			modifier: 'access',
			character: '3',
		},
	} );
	useShortcut( 'core/blocks/paragraph/transform-to-heading-3', ( event ) => {
		event.preventDefault();
		replaceBlocks(
			clientId,
			createBlock( 'core/heading', { level: 3, content, align } )
		);
	} );

	registerShortcut( {
		name: 'core/blocks/paragraph/transform-to-heading-4',
		category: 'block-library',
		description: __( 'Transform to heading.' ),
		keyCombination: {
			modifier: 'access',
			character: '4',
		},
	} );
	useShortcut( 'core/blocks/paragraph/transform-to-heading-4', ( event ) => {
		event.preventDefault();
		replaceBlocks(
			clientId,
			createBlock( 'core/heading', { level: 4, content, align } )
		);
	} );

	registerShortcut( {
		name: 'core/blocks/paragraph/transform-to-heading-5',
		category: 'block-library',
		description: __( 'Transform to heading.' ),
		keyCombination: {
			modifier: 'access',
			character: '5',
		},
	} );
	useShortcut( 'core/blocks/paragraph/transform-to-heading-5', ( event ) => {
		event.preventDefault();
		replaceBlocks(
			clientId,
			createBlock( 'core/heading', { level: 5, content, align } )
		);
	} );

	registerShortcut( {
		name: 'core/blocks/paragraph/transform-to-heading-6',
		category: 'block-library',
		description: __( 'Transform to heading.' ),
		keyCombination: {
			modifier: 'access',
			character: '6',
		},
	} );
	useShortcut( 'core/blocks/paragraph/transform-to-heading-6', ( event ) => {
		event.preventDefault();
		replaceBlocks(
			clientId,
			createBlock( 'core/heading', { level: 6, content, align } )
		);
	} );

	return null;
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

	return (
		<>
			<ParagrapgShortcuts
				attributes={ attributes }
				clientId={ clientId }
			/>
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
