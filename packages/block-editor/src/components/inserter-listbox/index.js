/**
 * WordPress dependencies
 */
import { Composite } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */

export { default as InserterListboxGroup } from './group';
export { default as InserterListboxRow } from './row';
export { default as InserterListboxItem } from './item';

function InserterListBoxWrapper( { key, children } ) {
	return <Fragment key={ key }>{ children }</Fragment>;
}

function InserterListbox( { children } ) {
	return (
		<Composite
			focusShift
			focusWrap="horizontal"
			render={ InserterListBoxWrapper }
		>
			{ children }
		</Composite>
	);
}

export default InserterListbox;
