import type { ShortcutKeyCombination } from './actions';

export interface ShortcutState {
	category: string;
	keyCombination: ShortcutKeyCombination;
	aliases?: ShortcutKeyCombination[];
	description: string;
}

export type ShortcutsState = Record< string, ShortcutState >;
