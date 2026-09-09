import styles from './style.module.css';
import type { ViewTabCountProps } from './types';

/**
 * Renders the number of items a view holds, to trail the label of the tab that
 * selects it.
 *
 * Nothing is rendered when there is no count, so that a tab whose count is not
 * known — because its view list is defined in the client, or because the count
 * has yet to resolve — reads as a plain label rather than showing a number that
 * is about to change.
 *
 * @param props
 * @param props.count The number of items the view holds.
 *
 * @example
 * ```jsx
 * <Tabs.Tab tabId={ entry.slug }>
 *   { entry.title }
 *   <ViewTabCount count={ entry.count } />
 * </Tabs.Tab>
 * ```
 */
export default function ViewTabCount( { count }: ViewTabCountProps ) {
	if ( typeof count !== 'number' ) {
		return null;
	}

	return <span className={ styles.count }>{ count.toLocaleString() }</span>;
}
