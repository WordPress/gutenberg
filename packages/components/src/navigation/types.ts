/**
 * Internal dependencies
 */
import type { ButtonProps } from '../button/types';

type IfDiscriminantDefinedBothRequired< TDiscriminant, TOther > =
	// When props in TDiscriminant are specified,
	// then props from TOther are required too
	| {
			[ K in keyof ( TDiscriminant & TOther ) ]: NonNullable<
				( TDiscriminant & TOther )[ K ]
			>;
	  }
	// When props in TDiscriminant are not specified,
	// then props from TOther are optional
	| ( {
			[ K in keyof TDiscriminant ]?: never;
	  } & {
			[ K in keyof TOther ]?: TOther[ K ];
	  } );

// React Components

export type NavigationProps = {
	/**
	 * The active item slug.
	 */
	activeItem?: string;
	/**
	 * The active menu slug.
	 *
	 * @default 'root'
	 */
	activeMenu?: string;
	/**
	 * The children components.
	 */
	children?: React.ReactNode;
	/**
	 * Optional classname for the component.
	 */
	className?: string;
	/**
	 * Callback used to sync the active menu between the external state
	 * and the Navigation's internal state.
	 */
	onActivateMenu?: ( activeMenuSlug: string ) => void;
};

// When `onSearch` is specified, `search` should be specified too
type _NavigationMenuSearchProps = IfDiscriminantDefinedBothRequired<
	{
		/**
		 * When the `hasSearch` prop is `true`, this callback handles the search
		 * input's `onChange` event, making it controlled from the outside.
		 * When using this prop, the `search` prop should be also set.
		 */
		onSearch: ( searchString: string ) => void;
	},
	{
		/**
		 * When the `hasSearch` is `true` and the `onSearch` prop is provided, this
		 * prop controls the value of the search input.
		 * Required when the `onSearch` prop is provided.
		 */
		search: string;
	}
>;

export type NavigationMenuProps = _NavigationMenuSearchProps & {
	/**
	 * The back button label used in nested menus.
	 * If not provided, the label will be inferred from the parent menu's title.
	 * If the parent menu's title is not available then it will default to "Back".
	 *
	 * @default parentMenuTitle ?? 'Back'
	 */
	backButtonLabel?: string;
	/**
	 * A callback to handle clicking on the back button.
	 * If this prop is provided then the back button will be shown.
	 */
	onBackButtonClick?: React.MouseEventHandler< HTMLElement >;
	/**
	 * The children components.
	 */
	children?: React.ReactNode;
	/**
	 * Optional classname for the component.
	 */
	className?: string;
	/**
	 * When `true`, enables the search feature on the menu title.
	 */
	hasSearch?: boolean;
	/**
	 * Indicates whether the menu is empty or not. Used together with the
	 * `hideIfTargetMenuEmpty` prop of `NavigationItem`.
	 */
	isEmpty?: boolean;
	/**
	 * Indicates whether the search is debouncing or not. In case of `true`, the
	 * "No results found." text is omitted. Used to prevent showing the
	 * "No results found." text between debounced searches.
	 */
	isSearchDebouncing?: boolean;
	/**
	 * The unique identifier of the menu.
	 * The root menu can omit this prop, and it will default to "root".
	 * All other menus need to specify it.
	 *
	 * @default 'root'
	 */
	menu?: string;
	/**
	 * The parent menu slug; used by nested menus to indicate their parent menu.
	 */
	parentMenu?: string;
	/**
	 * The menu title. It's also the field used by the menu search function.
	 */
	title?: string;
	/**
	 * Use this prop to render additional actions in the menu title.
	 */
	titleAction?: React.ReactNode;
};

export type NavigationGroupProps = {
	/**
	 * Optional classname for the component.
	 */
	className?: string;
	/**
	 * The group title.
	 */
	title?: string;
	/**
	 * The children components.
	 */
	children: React.ReactNode;
};

type _NavigationItemButtonProps =
	| ( ButtonProps & {
			/**
			 * If set to `true` the menu item will only act as a text-only item,
			 * rather than a `<button />` or `<a />` element.
			 */
			isText?: false;
	  } )
	| {
			/**
			 * If set to `true` the menu item will only act as a text-only item,
			 * rather than a `<button />` or `<a />` element.
			 */
			isText: true;
	  };

export type NavigationItemBaseProps = {
	/**
	 * The item badge content.
	 */
	badge?: string | number;
	/**
	 * The children components. When not specified, the item will render the
	 * default item UI.
	 */
	children?: React.ReactNode;
	/**
	 * Optional classname for the component.
	 */
	className?: string;
	/**
	 * If provided, causes the component to render an `<a />` element
	 * instead of a `<button />` element.
	 */
	href?: string;
	/**
	 * If no `children` are passed, this prop allows to specify a custom icon for
	 * the menu item.
	 */
	icon?: JSX.Element;
	/**
	 * The unique identifier of the item.
	 */
	item?: string;
	/**
	 * The child menu slug. If provided, clicking on the item will navigate
	 * to the target menu.
	 */
	navigateToMenu?: string;
	/**
	 * Indicates whether this item should be hidden if the menu specified in
	 * `navigateToMenu` is marked as empty in the `isEmpty` prop.
	 * Used together with the `isEmpty` prop of `NavigationMenu`.
	 */
	hideIfTargetMenuEmpty?: boolean;
	/**
	 * A callback to handle clicking on a menu item.
	 *
	 * @default noop
	 */
	onClick?: React.MouseEventHandler;
	/**
	 * The item title.
	 */
	title?: string;
};

export type NavigationItemProps = _NavigationItemButtonProps &
	NavigationItemBaseProps;

export type NavigationItemBaseContentProps = Pick<
	NavigationItemProps,
	'badge' | 'title'
>;

export type NavigationBackButtonProps = {
	/**
	 * The text displayed for the button
	 */
	backButtonLabel?: string;
	/**
	 * Optional classname for the component.
	 */
	className?: string;
	/**
	 * If provided, causes the component to render an `<a />` element
	 * instead of a `<button />` element.
	 */
	href?: string;
	/**
	 * Callback function called when the button is clicked.
	 */
	onClick?: React.MouseEventHandler;
	/**
	 * Id of the parent menu
	 */
	parentMenu?: string;
};

export type NavigationMenuTitleSearchProps = Pick<
	NavigationMenuProps,
	'onSearch' | 'search' | 'title'
> & {
	// @see `speak` function from `@wordpress/a11y`
	debouncedSpeak: (
		message: string,
		ariaLive?: 'off' | 'polite' | 'assertive'
	) => void;
	onCloseSearch: () => void;
};

export type NavigationMenuTitleProps = Pick<
	NavigationMenuProps,
	'hasSearch' | 'onSearch' | 'search' | 'title' | 'titleAction'
>;

export type NavigationSearchNoResultsFoundProps = Pick<
	NavigationMenuProps,
	'search'
>;

// Data objects & context

export type Item = Omit< NavigationItemBaseProps, 'children' > & {
	/**
	 * The group id
	 */
	group?: string;
	/**
	 * The menu id
	 */
	menu?: string;
	/**
	 * True is the item is currently visible (ie. the item is part
	 * of the active menu, and — if there is a search query — its title
	 * matches the search query).
	 */
	_isVisible: boolean;
};

export type Menu = Omit< NavigationMenuProps, 'children' > & {
	menu: string;
};

export type NavigationGroupContext = {
	/**
	 * The unique id of the group
	 */
	group?: string;
};

export type NavigationMenuContext = {
	menu?: string;
	search?: string;
};

export type NavigationContext = {
	activeItem?: string;
	activeMenu: string;
	setActiveMenu: (
		parentMenu: string,
		animationDirection?: 'left' | 'right'
	) => void;

	navigationTree: {
		items: Record< string, Item >;
		getItem: ( itemId: string ) => Item | undefined;
		addItem: ( itemId: string, itemProps: Item ) => void;
		removeItem: ( itemId: string ) => void;

		menus: Record< string, Menu >;
		getMenu: ( menuId: string ) => Menu | undefined;
		addMenu: ( menuId: string, menuProps: Menu ) => void;
		removeMenu: ( menuId: string ) => void;
		childMenu: Record< string, string[] >;
		traverseMenu: (
			startMenu: string,
			callback: ( menuObject: Menu ) => boolean | undefined
		) => void;
		isMenuEmpty: ( menuId: string ) => boolean;
	};
};
