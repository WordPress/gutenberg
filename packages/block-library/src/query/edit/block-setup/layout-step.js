/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { parse, store as blocksStore } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import {
	BlockPreview,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __, isRTL } from '@wordpress/i18n';
import {
	Button,
	Icon,
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { chevronRight, chevronLeft } from '@wordpress/icons';

const LayoutSetupStep = ( {
	blockType,
	onVariationSelect,
	onBlockPatternSelect,
} ) => {
	const [ showBack, setShowBack ] = useState( false );
	const {
		defaultVariation,
		blockVariations,
		patterns,
		hasBlockVariations,
	} = useSelect(
		( select ) => {
			const { getBlockVariations, getDefaultBlockVariation } = select(
				blocksStore
			);
			const { getSettings } = select( blockEditorStore );
			const { __experimentalBlockPatterns: allPatterns } = getSettings();
			const { name, isMatchingBlockPattern } = blockType;
			let _patterns;
			// TODO create selector
			if ( isMatchingBlockPattern ) {
				_patterns = allPatterns?.filter( isMatchingBlockPattern );
			}
			const _blockVariations = getBlockVariations( name, 'block' );
			return {
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				blockVariations: _blockVariations,
				patterns: _patterns,
				hasBlockVariations: !! _blockVariations?.length,
			};
		},
		[ blockType ]
	);
	const [ showBlockVariations, setShowBlockVariations ] = useState(
		! patterns?.length && hasBlockVariations
	);
	const composite = useCompositeState();
	// Show nothing if block variations and block pattterns do not exist.
	if ( ! hasBlockVariations && ! patterns?.length ) return null;

	const showPatternsList = ! showBlockVariations && !! patterns.length;
	return (
		<>
			{ showBack && (
				<Button
					className="block-setup-block-layout-back-button"
					icon={ isRTL() ? chevronRight : chevronLeft }
					isTertiary
					onClick={ () => {
						setShowBack( false );
						setShowBlockVariations( false );
					} }
				>
					{ __( 'Back' ) }
				</Button>
			) }
			<Composite
				{ ...composite }
				role="listbox"
				className="block-setup-block-layout-list__container"
				aria-label={ __( 'Layout list' ) }
			>
				{ showBlockVariations && (
					<>
						{ blockVariations.map( ( variation ) => (
							<BlockVariation
								key={ variation.name }
								variation={ variation }
								onSelect={ (
									nextVariation = defaultVariation
								) => onVariationSelect( nextVariation ) }
								composite={ composite }
							/>
						) ) }
					</>
				) }
				{ ! showBlockVariations && hasBlockVariations && (
					<BlockVariation
						key={ defaultVariation.name }
						title={ __( 'Start empty' ) }
						variation={ defaultVariation }
						onSelect={ () => {
							setShowBack( true );
							setShowBlockVariations( true );
						} }
						composite={ composite }
					/>
				) }
				{ showPatternsList && (
					<>
						{ patterns.map( ( pattern ) => (
							<BlockPattern
								key={ pattern.name }
								pattern={ pattern }
								onSelect={ onBlockPatternSelect }
								composite={ composite }
							/>
						) ) }
					</>
				) }
			</Composite>
		</>
	);
};

function BlockPattern( { pattern, onSelect, composite } ) {
	const { content, viewportWidth } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );
	const descriptionId = useInstanceId(
		BlockPattern,
		'block-setup-block-layout-list__item-description'
	);
	return (
		<div
			className="block-setup-block-layout-list__list-item"
			aria-label={ pattern.title }
			// aria-describedby={ variation.description ? descriptionId : undefined }
		>
			<CompositeItem
				role="option"
				as="div"
				{ ...composite }
				className="block-setup-block-layout-list__item"
				onClick={ () => onSelect( blocks ) }
			>
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ viewportWidth }
				/>
				<div className="block-setup-block-layout-list__item-title">
					{ pattern.title }
				</div>
				{ !! pattern.description && (
					<VisuallyHidden id={ descriptionId }>
						{ pattern.description }
					</VisuallyHidden>
				) }
			</CompositeItem>
		</div>
	);
}

function BlockVariation( { variation, title, onSelect, composite } ) {
	const descriptionId = useInstanceId(
		BlockVariation,
		'block-setup-block-layout-list__item-description'
	);
	return (
		<div
			className="block-setup-block-layout-list__list-item is-block-variation"
			aria-label={ variation.title }
			aria-describedby={
				variation.description ? descriptionId : undefined
			}
		>
			<CompositeItem
				role="option"
				as="div"
				{ ...composite }
				className="block-setup-block-layout-list__item"
				onClick={ () => onSelect( variation ) }
				label={ title || variation.description || variation.title }
			>
				<div className="block-setup-block-layout-list__item-variation-icon">
					<Icon icon={ variation.icon } size={ 48 } />
				</div>
				<div className="block-setup-block-layout-list__item-title">
					{ title || variation.title }
				</div>
				{ !! variation.description && (
					<VisuallyHidden id={ descriptionId }>
						{ variation.description }
					</VisuallyHidden>
				) }
			</CompositeItem>
		</div>
	);
}

export default LayoutSetupStep;
