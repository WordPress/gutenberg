/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';

const LayoutSetupStep = ( { blockType, onVariationSelect } ) => {
	const { defaultVariation, blockVariations, hasBlockVariations } = useSelect(
		( select ) => {
			const { getBlockVariations, getDefaultBlockVariation } = select(
				blocksStore
			);
			const { __experimentalGetPatternsByBlockTypes } = select(
				blockEditorStore
			);
			const { name } = blockType;
			const _patterns = __experimentalGetPatternsByBlockTypes( name );
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
	const composite = useCompositeState();
	// Show nothing if block variations and block pattterns do not exist.
	if ( ! hasBlockVariations ) return null;

	return (
		<>
			<Composite
				{ ...composite }
				role="listbox"
				className="block-setup-block-layout-list__container"
				aria-label={ __( 'Layout list' ) }
			>
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
			</Composite>
		</>
	);
};

function BlockVariation( { variation, onSelect, composite } ) {
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
				label={ variation.description || variation.title }
			>
				{ variation.icon && (
					<div className="block-setup-block-layout-list__item-variation-icon">
						<Icon icon={ variation.icon } size={ 48 } />
					</div>
				) }
			</CompositeItem>
			<div className="block-setup-block-layout-list__item-title">
				{ variation.title }
			</div>
			{ !! variation.description && (
				<VisuallyHidden id={ descriptionId }>
					{ variation.description }
				</VisuallyHidden>
			) }
		</div>
	);
}

export default LayoutSetupStep;
