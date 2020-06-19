/**
 * Internal dependencies
 */
import RovingTabIndexItem from './roving-tab-index-item';

export default function TreeGridItem( { children, ...props } ) {
	return <RovingTabIndexItem { ...props }>{ children }</RovingTabIndexItem>;
}
