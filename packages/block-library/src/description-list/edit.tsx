import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import DescriptionListStructureWarning from './structure-warning';

const DEFAULT_BLOCK = {
	name: 'core/description-term',
};

export default function Edit( {
	clientId,
	isSelected,
}: {
	clientId: string;
	isSelected: boolean;
} ) {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,
		templateLock: false,
	} );

	return (
		<>
			<DescriptionListStructureWarning
				clientId={ clientId }
				isSelected={ isSelected }
			/>
			<dl { ...innerBlocksProps } />
		</>
	);
}
