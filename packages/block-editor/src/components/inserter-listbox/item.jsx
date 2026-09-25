import { Button, Composite } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

function InserterListboxItem(
	{ isFirst, as: Component, children, ...props },
	ref
) {
	return (
		<Composite.Item
			ref={ ref }
			role="option"
			// Use the Composite.Item `accessibleWhenDisabled` prop
			// over Button's `isFocusable`. The latter was shown to
			// cause an issue with tab order in the inserter list.
			accessibleWhenDisabled
			// Manage the roving tab index below. Otherwise every item
			// re-renders to update it once the items have registered.
			tabbable
			// Without an explicit type, every item re-renders after mount
			// once Ariakit detects the native button.
			type="button"
			{ ...props }
			render={ ( htmlProps ) => {
				const propsWithTabIndex = {
					...htmlProps,
					tabIndex:
						isFirst || htmlProps[ 'data-active-item' ] ? 0 : -1,
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
				return (
					<Button __next40pxDefaultSize { ...propsWithTabIndex }>
						{ children }
					</Button>
				);
			} }
		/>
	);
}

export default forwardRef( InserterListboxItem );
