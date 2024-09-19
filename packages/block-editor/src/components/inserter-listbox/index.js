/**
 * WordPress dependencies
 */
import { Composite } from '@wordpress/components';

/**
 * Internal dependencies
 */

export { default as InserterListboxGroup } from './group';
export { default as InserterListboxRow } from './row';
export { default as InserterListboxItem } from './item';

function InserterListbox( { children } ) {
	return (
		<Composite focusShift focusWrap="horizontal" render={ <></> }>
			{ children }
		</Composite>
	);
}

export default InserterListbox;
