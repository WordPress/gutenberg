import type { Block, BlockTypeIconDescriptor } from '@wordpress/blocks';
import type { InserterItem } from '../../store/types';

/**
 * A block transformation offered as a command.
 */
export type TransformCommandItem = Omit< InserterItem, 'icon' > & {
	icon?: BlockTypeIconDescriptor;
	variationName?: string;
};

/**
 * The selection the transform commands are built from: invalid when it has
 * missing blocks.
 */
export type TransformCommandsSelection =
	| {
			invalidSelection: true;
			blocks?: undefined;
			clientIds?: undefined;
			canRemove?: undefined;
			possibleBlockTransformations?: undefined;
	  }
	| {
			invalidSelection: false;
			blocks: Block[];
			clientIds: string[];
			canRemove: boolean;
			possibleBlockTransformations: TransformCommandItem[];
	  };
