/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { Placeholder } from '@wordpress/components';

/**
 * Internal dependencies
 */
import LayoutSetupStep from './layout-step';

const BlockSetup = ( {
	blockName,
	useLayoutSetup,
	onVariationSelect = () => {},
	onBlockPatternSelect = () => {},
	children,
} ) => {
	const { blockType } = useSelect(
		( select ) => {
			const { getBlockType } = select( blocksStore );
			return { blockType: getBlockType( blockName ) };
		},
		[ blockName ]
	);
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ blockType?.icon?.src }
				label={ blockType?.title }
				isColumnLayout
			>
				{ useLayoutSetup && (
					<LayoutSetupStep
						blockType={ blockType }
						onVariationSelect={ onVariationSelect }
						onBlockPatternSelect={ onBlockPatternSelect }
					/>
				) }
				{ children }
			</Placeholder>
		</div>
	);
};

export default BlockSetup;
