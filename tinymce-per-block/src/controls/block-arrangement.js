/**
 * External dependencies
 */
import { createElement } from 'wp-elements';
import { getBlock } from 'wp-blocks';
import { ArrowDownAlt2Icon, ArrowUpAlt2Icon } from 'dashicons';

export default function BlockArrangement( { block, moveBlockUp, moveBlockDown } ) {
	const blockDefinition = getBlock( block.blockType );
	const Icon = blockDefinition.icon;
	const onMoveUp = ( event ) => {
		event.stopPropagation();
		moveBlockUp();
	};
	const onMoveDown = ( event ) => {
		event.stopPropagation();
		moveBlockDown();
	};

	return (
		<div className="block-list__block-arrangement">
			<div className="block-list__movement-controls">
				<button className="block-list__block-arrange-control" onClick={ onMoveUp }>
					<ArrowUpAlt2Icon />
				</button>
				<button className="block-list__block-arrange-control" onClick={ onMoveDown }>
					<ArrowDownAlt2Icon />
				</button>
			</div>
			{ Icon && (
				<div className="block-list__type-controls">
					<button className="block-list__block-arrange-control">
						<Icon />
					</button>
				</div>
			) }
		</div>
	);
}
