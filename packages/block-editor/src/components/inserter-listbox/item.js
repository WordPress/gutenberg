/**
 * External dependencies
 */
import { CompositeItem } from 'reakit/Composite';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterListboxContext from './context';

function InserterListboxItem(
	{ isFirst, as: Component, children, ...props },
	ref
) {
	const state = useContext( InserterListboxContext );
	return (
		<CompositeItem state={ state } role="option" ref={ ref } { ...props }>
			{ ( htmlProps ) => {
				const propsWithTabIndex = {
					...htmlProps,
					tabIndex: isFirst ? 0 : htmlProps.tabIndex,
				};
				if ( Component ) {
					return (
						<Component { ...propsWithTabIndex }>
							{ children }
						</Component>
					);
				}
				if ( typeof children === 'function' ) {
					return children( propsWithTabIndex );
				}
				return <Button { ...propsWithTabIndex }>{ children }</Button>;
			} }
		</CompositeItem>
	);
}

export default forwardRef( InserterListboxItem );
