/**
 * WordPress dependencies
 */
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useInspectorControlsFill from './hook';

export default function InspectorControlsFill( {
	__experimentalGroup: group = 'default',
	__experimentalExposeToChildren = false,
	children,
} ) {
	const Fill = useInspectorControlsFill(
		group,
		__experimentalExposeToChildren
	);
	if ( ! Fill ) {
		return null;
	}

	return (
		<StyleProvider document={ document }>
			<Fill>{ children }</Fill>
		</StyleProvider>
	);
}
