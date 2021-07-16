/**
 * WordPress dependencies
 */
import {
	Button,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
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
		<CompositeItem
			ref={ ref }
			state={ state }
			role="option"
			// Use the CompositeItem `focusable` prop over Button's
			// isFocusable. The latter was shown to cause an issue
			// with tab order in the inserter list.
			focusable
			{ ...props }
		>
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
