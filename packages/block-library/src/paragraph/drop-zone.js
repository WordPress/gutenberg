/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	__experimentalUseOnBlockDrop as useOnBlockDrop,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __experimentalUseDropZone as useDropZone } from '@wordpress/compose';
import {
	Popover,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';

export default function DropZone( { paragraphElement, clientId } ) {
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
	const onBlockDrop = useOnBlockDrop( rootClientId, blockIndex, true );
	const [ isVisible, setIsVisible ] = useState( false );
	const dropZoneRef = useDropZone( {
		onDrop: onBlockDrop,
		onDragEnter: () => {
			setIsVisible( true );
		},
		onDragLeave: () => {
			setIsVisible( false );
		},
	} );

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
			<div
				ref={ dropZoneRef }
				className="wp-block-paragraph__drop-zone-backdrop"
				style={ {
					width: paragraphElement?.offsetWidth,
					height: paragraphElement?.offsetHeight,
				} }
			>
				<AnimatePresence>
					{ isVisible ? (
						<motion.div
							key="drop-zone-foreground"
							initial={ { opacity: 0, scale: 0.75 } }
							animate={ { opacity: 1, scale: 1 } }
							exit={ { opacity: 0, scale: 0.95 } }
							className="wp-block-paragraph__drop-zone-foreground"
						/>
					) : null }
				</AnimatePresence>
			</div>
		</Popover>
	);
}
