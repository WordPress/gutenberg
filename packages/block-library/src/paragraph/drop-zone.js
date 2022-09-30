/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	__experimentalUseOnBlockDrop as useOnBlockDrop,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	__experimentalUseDropZone as useDropZone,
	useReducedMotion,
} from '@wordpress/compose';
import { Popover, __unstableMotion as motion } from '@wordpress/components';

const animateVariants = {
	hide: { opacity: 0, scaleY: 0.75 },
	show: { opacity: 1, scaleY: 1 },
	exit: { opacity: 0, scaleY: 0.9 },
};

export default function DropZone( {
	paragraphElement,
	clientId,
	setIsDropZoneVisible,
} ) {
	const { rootClientId, blockIndex } = useSelect(
		( select ) => {
			const selectors = select( blockEditorStore );
			return {
				rootClientId: selectors.getBlockRootClientId( clientId ),
				blockIndex: selectors.getBlockIndex( clientId ),
			};
		},
		[ clientId ]
	);
	const onBlockDrop = useOnBlockDrop( rootClientId, blockIndex, {
		action: 'replace',
	} );
	const dropZoneRef = useDropZone( {
		onDrop: onBlockDrop,
		onDragLeave: () => {
			setIsDropZoneVisible( false );
		},
	} );
	const reducedMotion = useReducedMotion();

	return (
		<Popover
			anchor={ paragraphElement }
			animate={ false }
			placement="top-start"
			focusOnMount={ false }
			flip={ false }
			resize={ false }
			className="wp-block-paragraph__drop-zone"
		>
			<motion.div
				ref={ dropZoneRef }
				style={ {
					width: paragraphElement?.offsetWidth,
					height: paragraphElement?.offsetHeight,
				} }
				data-testid="empty-paragraph-drop-zone"
				initial={
					reducedMotion ? animateVariants.show : animateVariants.hide
				}
				animate={ animateVariants.show }
				exit={
					reducedMotion ? animateVariants.show : animateVariants.exit
				}
				className="wp-block-paragraph__drop-zone-foreground"
			/>
		</Popover>
	);
}
