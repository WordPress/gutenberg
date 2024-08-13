/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { CompositeItemV2: CompositeItem } = unlock( componentsPrivateApis );

function InserterListboxItem(
	{ isFirst, as: Component, children, ...props },
	ref
) {
	return (
		<CompositeItem
			ref={ ref }
			role="option"
			// Use the CompositeItem `accessibleWhenDisabled` prop
			// over Button's `isFocusable`. The latter was shown to
			// cause an issue with tab order in the inserter list.
			accessibleWhenDisabled
			{ ...props }
			render={ ( htmlProps ) => {
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
		/>
	);
}

export default forwardRef( InserterListboxItem );
