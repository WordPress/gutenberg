/**
 * WordPress dependencies
 */
import { __unstableUseCompositeState as useCompositeState } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterListboxContext from './context';

export { default as InserterListboxGroup } from './group';
export { default as InserterListboxRow } from './row';
export { default as InserterListboxItem } from './item';

function InserterListbox( props, ref ) {
	const compositeState = useCompositeState( {
		shift: true,
		wrap: 'horizontal',
	} );
	return (
		<InserterListboxContext.Provider value={ compositeState }>
			<div { ...props } ref={ ref } />
		</InserterListboxContext.Provider>
	);
}

export default forwardRef( InserterListbox );
