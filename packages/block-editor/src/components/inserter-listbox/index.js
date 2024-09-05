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

const { CompositeV2: Composite } = unlock( componentsPrivateApis );

function InserterListbox( { children } ) {
	return (
		<Composite focusShift focusWrap="horizontal" render={ <></> }>
			{ children }
		</Composite>
	);
}

export default InserterListbox;
