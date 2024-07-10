/**
 * WordPress dependencies
 */
import { Composite, useCompositeStore } from '@wordpress/components';

export { default as InserterListboxGroup } from './group';
export { default as InserterListboxRow } from './row';
export { default as InserterListboxItem } from './item';

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
