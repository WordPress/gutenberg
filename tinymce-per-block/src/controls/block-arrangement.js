/**
 * External dependencies
 */
import { createElement } from 'wp-elements';
import { getBlock } from 'wp-blocks';
import { ArrowDownAlt2Icon, ArrowUpAlt2Icon } from 'dashicons';

export default function BlockArrangement( { block, moveBlockUp, moveBlockDown } ) {
	const blockDefinition = getBlock( block.blockType );
	const Icon = blockDefinition.icon;

	return (
		<div className="block-list__block-arrangement">
			<div className="block-list__movement-controls">
				<button className="block-list__block-arrange-control" onClick={ moveBlockUp }>
					<ArrowUpAlt2Icon />
				</button>
				<button className="block-list__block-arrange-control" onClick={ moveBlockDown }>
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
