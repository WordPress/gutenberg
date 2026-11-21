import { createSlotFill } from '@wordpress/components';
import type { InserterMenuExtension } from './types';

const { Fill: __unstableInserterMenuExtension, Slot } = createSlotFill(
	'__unstableInserterMenuExtension'
);

// The fill carries its slot as a static.
( __unstableInserterMenuExtension as InserterMenuExtension ).Slot = Slot;

export default __unstableInserterMenuExtension as InserterMenuExtension;
