/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

export { default as InserterListboxGroup } from './group';
export { default as InserterListboxRow } from './row';
export { default as InserterListboxItem } from './item';

const { CompositeV2: Composite, useCompositeStoreV2: useCompositeStore } =
	unlock( componentsPrivateApis );

function InserterListbox( { children } ) {
	const store = useCompositeStore( {
		focusShift: true,
		focusWrap: 'horizontal',
	} );

	return (
		<Composite store={ store } render={ <></> }>
			{ children }
		</Composite>
	);
}

export default InserterListbox;
