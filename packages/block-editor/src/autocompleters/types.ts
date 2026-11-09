import type { Completer } from '../components/autocomplete/types';

/**
 * A completer that lists its items through `useItems`, so it has no
 * `options` to label.
 */
export type BlockCompleter = Omit< Completer, 'options' | 'getOptionLabel' >;
