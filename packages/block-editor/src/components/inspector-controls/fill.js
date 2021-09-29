/**
 * WordPress dependencies
 */
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import useDisplayBlockControls from '../use-display-block-controls';
import groups from './groups';

export default function InspectorControlsFill( {
	__experimentalGroup: group = 'default',
	children,
} ) {
	const isDisplayed = useDisplayBlockControls();
	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControl group "${ group }" provided.` );
		return null;
	}
	if ( ! isDisplayed ) {
		return null;
	}

	return (
		<StyleProvider document={ document }>
			<Fill>{ children }</Fill>
		</StyleProvider>
	);
}
