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
import { __ } from '@wordpress/i18n';
import {
	Button,
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';

const LayoutSetupStep = ( {
	blockType,
	onVariationSelect,
	onBlockPatternSelect,
} ) => {
	const { defaultVariation, blockVariations, patterns } = useSelect(
		( select ) => {
			const { getBlockVariations, getDefaultBlockVariation } = select(
				blocksStore
			);
			const { getSettings } = select( blockEditorStore );
			const { __experimentalBlockPatterns: allPatterns } = getSettings();
			const { name, isMatchingBlockPattern } = blockType;
			let _patterns;
			if ( isMatchingBlockPattern ) {
				_patterns = allPatterns?.filter( isMatchingBlockPattern );
			}
			return {
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				blockVariations: getBlockVariations( name, 'block' ),
				patterns: _patterns,
			};
		},
		[ blockType ]
	);
	const [ showBlockVariations, setShowBlockVariations ] = useState(
		! patterns?.length
	);

	// TODO check about `useAsyncList`
	const composite = useCompositeState();
	// TODO check this line :)
	if ( ! showBlockVariations && ! patterns?.length ) return null;
	const showPatternsList = ! showBlockVariations && !! patterns.length;
	return (
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
							onSelect={ ( nextVariation = defaultVariation ) =>
								onVariationSelect( nextVariation )
							}
							composite={ composite }
						/>
					) ) }
				</>
			) }
			{ ! showBlockVariations && !! blockVariations?.length && (
				<BlockVariation
					key={ defaultVariation.name }
					title={ __( 'Start empty' ) }
					variation={ defaultVariation }
					onSelect={ () => {
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
				<div className="block-setup-block-layout-list__item-variation">
					<Button
						isSecondary
						icon={ variation.icon }
						iconSize={ 48 }
						label={
							title || variation.description || variation.title
						}
					/>
					<div className="block-setup-block-layout-list__item-title">
						{ title || variation.title }
					</div>
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
