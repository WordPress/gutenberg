/**
 * External dependencies
 */
import type * as Ariakit from '@ariakit/react';

export type CompositeContextProps =
	| {
			/**
			 * Object returned by the `useCompositeStore` hook.
			 */
			store: Ariakit.CompositeStore;
	  }
	| undefined;

export type CompositeStoreProps = {
	/**
	 * The current active item `id`. The active item is the element within the
	 * composite widget that has either DOM or virtual focus (in case
	 * the `virtualFocus` prop is enabled).
	 * - `null` represents the base composite element (the one with a [composite
	 *   role](https://w3c.github.io/aria/#composite)). Users will be able to
	 *   navigate out of it using arrow keys.
	 * - If `activeId` is initially set to `null`, the base composite element
	 *   itself will have focus and users will be able to navigate to it using
	 *   arrow keys.
	 */
	activeId?: Ariakit.CompositeStoreProps[ 'activeId' ];
	/**
	 * The composite item id that should be active by default when the composite
	 * widget is rendered. If `null`, the composite element itself will have focus
	 * and users will be able to navigate to it using arrow keys. If `undefined`,
	 * the first enabled item will be focused.
	 */
	defaultActiveId?: Ariakit.CompositeStoreProps[ 'defaultActiveId' ];
	/**
	 * A callback that gets called when the `activeId` state changes.
	 */
	setActiveId?: Ariakit.CompositeStoreProps[ 'setActiveId' ];
	/**
	 * Determines how the focus behaves when the user reaches the end of the
	 * composite widget.
	 *
	 * On one-dimensional composite widgets:
	 * - `true` loops from the last item to the first item and vice-versa.
	 * - `horizontal` loops only if `orientation` is `horizontal` or not set.
	 * - `vertical` loops only if `orientation` is `vertical` or not set.
	 * - If `activeId` is initially set to `null`, the composite element will
	 *   be focused in between the last and first items.
	 *
	 * On two-dimensional composite widgets (ie. when using `CompositeRow`):
	 * - `true` loops from the last row/column item to the first item in the same
	 *   row/column and vice-versa. If it's the last item in the last row, it
	 *   moves to the first item in the first row and vice-versa.
	 * - `horizontal` loops only from the last row item to the first item in the
	 *   same row.
	 * - `vertical` loops only from the last column item to the first item in the
	 *   column row.
	 * - If `activeId` is initially set to `null`, vertical loop will have no
	 *   effect as moving down from the last row or up from the first row will
	 *   focus on the composite element.
	 * - If `focusWrap` matches the value of `focusLoop`, it'll wrap between the
	 *   last item in the last row or column and the first item in the first row or
	 *   column and vice-versa.
	 *
	 * @default false
	 */
	focusLoop?: Ariakit.CompositeStoreProps[ 'focusLoop' ];
	/**
	 * **Works only on two-dimensional composite widgets**.
	 *
	 * If enabled, moving to the next item from the last one in a row or column
	 * will focus on the first item in the next row or column and vice-versa.
	 * - `true` wraps between rows and columns.
	 * - `horizontal` wraps only between rows.
	 * - `vertical` wraps only between columns.
	 * - If `focusLoop` matches the value of `focusWrap`, it'll wrap between the
	 *   last item in the last row or column and the first item in the first row or
	 *   column and vice-versa.
	 *
	 * @default false
	 */
	focusWrap?: Ariakit.CompositeStoreProps[ 'focusWrap' ];
	/**
	 * **Works only on two-dimensional composite widgets**.
	 *
	 * If enabled, moving up or down when there's no next item or when the next
	 * item is disabled will shift to the item right before it.
	 *
	 * @default false
	 */
	focusShift?: Ariakit.CompositeStoreProps[ 'focusShift' ];
	/**
	 * If enabled, the composite element will act as an
	 * [`aria-activedescendant`](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_activedescendant)
	 * container instead of [roving
	 * tabindex](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex).
	 * DOM focus will remain on the composite element while its items receive
	 * virtual focus.
	 *
	 * In both scenarios, the item in focus will carry the `data-active-item`
	 * attribute.
	 *
	 * @default false
	 */
	virtualFocus?: Ariakit.CompositeStoreProps[ 'virtualFocus' ];
	/**
	 * Defines the orientation of the composite widget. If the composite has a
	 * single row or column (one-dimensional), the `orientation` value determines
	 * which arrow keys can be used to move focus:
	 * - `both`: all arrow keys work.
	 * - `horizontal`: only left and right arrow keys work.
	 * - `vertical`: only up and down arrow keys work.
	 *
	 * It doesn't have any effect on two-dimensional composites.
	 *
	 * @default "both"
	 */
	orientation?: Ariakit.CompositeStoreProps[ 'orientation' ];
	/**
	 * Determines how the `store`'s `next` and `previous` functions will behave.
	 * If `rtl` is set to `true`, they will be inverted.
	 *
	 * This only affects the composite widget behavior. You still need to set
	 * `dir="rtl"` on HTML/CSS.
	 *
	 * @default false
	 */
	rtl?: Ariakit.CompositeStoreProps[ 'rtl' ];
};

export type CompositeProps = {
	/**
	 * Object returned by the `useCompositeStore` hook.
	 */
	store: Ariakit.CompositeStore;
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.CompositeProps[ 'render' ];
	/**
	 * Makes the component a focusable element. When this element gains keyboard
	 * focus, it gets a `data-focus-visible` attribute and triggers the
	 * `onFocusVisible` prop.
	 * The component supports the `disabled` prop even for those elements not
	 * supporting the native `disabled` attribute. Disabled elements may be
	 * still accessible via keyboard by using the the `accessibleWhenDisabled`
	 * prop.
	 * Non-native focusable elements will lose their focusability entirely.
	 * However, native focusable elements will retain their inherent focusability.
	 */
	focusable?: Ariakit.CompositeProps[ 'focusable' ];
	/**
	 * Determines if the element is disabled. This sets the `aria-disabled`
	 * attribute accordingly, enabling support for all elements, including those
	 * that don't support the native `disabled` attribute.
	 *
	 * This feature can be combined with the `accessibleWhenDisabled` prop to
	 * make disabled elements still accessible via keyboard.
	 *
	 * **Note**: For this prop to work, the `focusable` prop must be set to
	 * `true`, if it's not set by default.
	 *
	 * @default false
	 */
	disabled?: Ariakit.CompositeProps[ 'disabled' ];
	/**
	 * Indicates whether the element should be focusable even when it is
	 * `disabled`.
	 *
	 * This is important when discoverability is a concern. For example:
	 *
	 * > A toolbar in an editor contains a set of special smart paste functions
	 * that are disabled when the clipboard is empty or when the function is not
	 * applicable to the current content of the clipboard. It could be helpful to
	 * keep the disabled buttons focusable if the ability to discover their
	 * functionality is primarily via their presence on the toolbar.
	 *
	 * Learn more on [Focusability of disabled
	 * controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols).
	 */
	accessibleWhenDisabled?: Ariakit.CompositeProps[ 'accessibleWhenDisabled' ];
	/**
	 * Custom event handler invoked when the element gains focus through keyboard
	 * interaction or a key press occurs while the element is in focus. This is
	 * the programmatic equivalent of the `data-focus-visible` attribute.
	 *
	 * **Note**: For this prop to work, the `focusable` prop must be set to `true`
	 * if it's not set by default.
	 */
	onFocusVisible?: Ariakit.CompositeProps[ 'onFocusVisible' ];
	/**
	 * The contents of the component.
	 */
	children?: Ariakit.CompositeProps[ 'children' ];
};

export type CompositeGroupProps = {
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.CompositeGroupProps[ 'render' ];
	/**
	 * The contents of the component.
	 */
	children?: Ariakit.CompositeGroupProps[ 'children' ];
};

export type CompositeGroupLabelProps = {
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.CompositeGroupLabelProps[ 'render' ];
	/**
	 * The contents of the component.
	 */
	children?: Ariakit.CompositeGroupLabelProps[ 'children' ];
};

export type CompositeItemProps = {
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.CompositeItemProps[ 'render' ];
	/**
	 * The contents of the component.
	 */
	children?: Ariakit.CompositeItemProps[ 'children' ];
	/**
	 * Indicates whether the element should be focusable even when it is
	 * `disabled`.
	 *
	 * This is important when discoverability is a concern. For example:
	 *
	 * > A toolbar in an editor contains a set of special smart paste functions
	 * that are disabled when the clipboard is empty or when the function is not
	 * applicable to the current content of the clipboard. It could be helpful to
	 * keep the disabled buttons focusable if the ability to discover their
	 * functionality is primarily via their presence on the toolbar.
	 *
	 * Learn more on [Focusability of disabled
	 * controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols).
	 */
	accessibleWhenDisabled?: Ariakit.CompositeItemProps[ 'accessibleWhenDisabled' ];
};

export type CompositeRowProps = {
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.CompositeRowProps[ 'render' ];
	/**
	 * The contents of the component.
	 */
	children?: Ariakit.CompositeRowProps[ 'children' ];
};

export type CompositeHoverProps = {
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.CompositeHoverProps[ 'render' ];
	/**
	 * The contents of the component.
	 */
	children?: Ariakit.CompositeHoverProps[ 'children' ];
};

export type CompositeTypeaheadProps = {
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.CompositeTypeaheadProps[ 'render' ];
	/**
	 * The contents of the component.
	 */
	children?: Ariakit.CompositeTypeaheadProps[ 'children' ];
};
