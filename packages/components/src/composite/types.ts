type IdActions = {
	/**
	 * Sets `baseId`.
	 */
	setBaseId: React.Dispatch< React.SetStateAction< string > >;
};

type IdState = {
	baseId: string;
	/**
	 * @private
	 */
	unstable_idCountRef: React.MutableRefObject< number >;
};

type IdInitialState = Partial< Pick< IdState, 'baseId' > >;

type IdStateReturn = IdState & IdActions;

type Group = {
	id: string;
	ref: React.RefObject< HTMLElement >;
};

type Item = {
	id: string | null;
	ref: React.RefObject< HTMLElement >;
	groupId?: Group[ 'id' ];
	disabled?: boolean;
};

type Orientation = 'horizontal' | 'vertical';

type CompositeState = IdState & {
	/**
	 * If enabled, the composite element will act as an
	 * [aria-activedescendant](https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_focus_activedescendant)
	 * container instead of
	 * [roving tabindex](https://www.w3.org/TR/wai-aria-practices/#kbd_roving_tabindex).
	 * DOM focus will remain on the composite while its items receive virtual focus.
	 * @default false
	 */
	unstable_virtual: boolean;
	/**
	 * Determines how `next` and `previous` functions will behave. If `rtl` is
	 * set to `true`, they will be inverted. This only affects the composite
	 * widget behavior. You still need to set `dir="rtl"` on HTML/CSS.
	 * @default false
	 */
	rtl: boolean;
	/**
	 * Defines the orientation of the composite widget. If the composite has a
	 * single row or column (one-dimensional), the `orientation` value determines
	 * which arrow keys can be used to move focus:
	 *   - `undefined`: all arrow keys work.
	 *   - `horizontal`: only left and right arrow keys work.
	 *   - `vertical`: only up and down arrow keys work.
	 *
	 * It doesn't have any effect on two-dimensional composites.
	 * @default undefined
	 */
	orientation?: Orientation;
	/**
	 * Lists all the composite items with their `id`, DOM `ref`, `disabled` state
	 * and `groupId` if any. This state is automatically updated when
	 * `registerItem` and `unregisterItem` are called.
	 * @example
	 * const composite = useCompositeState();
	 * composite.items.forEach((item) => {
	 *   const { id, ref, disabled, groupId } = item;
	 *   ...
	 * });
	 */
	items: Item[];
	/**
	 * Lists all the composite groups with their `id` and DOM `ref`. This state
	 * is automatically updated when `registerGroup` and `unregisterGroup` are
	 * called.
	 * @example
	 * const composite = useCompositeState();
	 * composite.groups.forEach((group) => {
	 *   const { id, ref } = group;
	 *   ...
	 * });
	 */
	groups: Group[];
	/**
	 * The current focused item `id`.
	 *   - `undefined` will automatically focus the first enabled composite item.
	 *   - `null` will focus the base composite element and users will be able to
	 * navigate out of it using arrow keys.
	 *   - If `currentId` is initially set to `null`, the base composite element
	 * itself will have focus and users will be able to navigate to it using
	 * arrow keys.
	 * @default undefined
	 * @example
	 * // First enabled item has initial focus
	 * useCompositeState();
	 * // Base composite element has initial focus
	 * useCompositeState({ currentId: null });
	 * // Specific composite item element has initial focus
	 * useCompositeState({ currentId: "item-id" });
	 */
	currentId?: string | null;
	/**
	 * On one-dimensional composites:
	 *   - `true` loops from the last item to the first item and vice-versa.
	 *   - `horizontal` loops only if `orientation` is `horizontal` or not set.
	 *   - `vertical` loops only if `orientation` is `vertical` or not set.
	 *   - If `currentId` is initially set to `null`, the composite element will
	 * be focused in between the last and first items.
	 *
	 * On two-dimensional composites:
	 *   - `true` loops from the last row/column item to the first item in the
	 * same row/column and vice-versa. If it's the last item in the last row, it
	 * moves to the first item in the first row and vice-versa.
	 *   - `horizontal` loops only from the last row item to the first item in
	 * the same row.
	 *   - `vertical` loops only from the last column item to the first item in
	 * the column row.
	 *   - If `currentId` is initially set to `null`, vertical loop will have no
	 * effect as moving down from the last row or up from the first row will
	 * focus the composite element.
	 *   - If `wrap` matches the value of `loop`, it'll wrap between the last
	 * item in the last row or column and the first item in the first row or
	 * column and vice-versa.
	 * @default false
	 */
	loop: boolean | Orientation;
	/**
	 * **Has effect only on two-dimensional composites**. If enabled, moving to
	 * the next item from the last one in a row or column will focus the first
	 * item in the next row or column and vice-versa.
	 *   - `true` wraps between rows and columns.
	 *   - `horizontal` wraps only between rows.
	 *   - `vertical` wraps only between columns.
	 *   - If `loop` matches the value of `wrap`, it'll wrap between the last
	 * item in the last row or column and the first item in the first row or
	 * column and vice-versa.
	 * @default false
	 */
	wrap: boolean | Orientation;
	/**
	 * **Has effect only on two-dimensional composites**. If enabled, moving up
	 * or down when there's no next item or the next item is disabled will shift
	 * to the item right before it.
	 * @default false
	 */
	shift: boolean;
	/**
	 * Stores the number of moves that have been performed by calling `move`,
	 * `next`, `previous`, `up`, `down`, `first` or `last`.
	 * @default 0
	 */
	unstable_moves: number;
	/**
	 * @default false
	 * @private
	 */
	unstable_hasActiveWidget: boolean;
	/**
	 * @default false
	 * @private
	 */
	unstable_includesBaseElement: boolean;
};

export type CompositeInitialState = IdInitialState &
	Partial<
		Pick<
			CompositeState,
			| 'unstable_virtual'
			| 'rtl'
			| 'orientation'
			| 'currentId'
			| 'loop'
			| 'wrap'
			| 'shift'
			| 'unstable_includesBaseElement'
		>
	>;

type CompositeActions = IdActions & {
	/**
	 * Registers a composite item.
	 * @example
	 * const ref = React.useRef();
	 * const composite = useCompositeState();
	 * React.useEffect(() => {
	 *   composite.registerItem({ ref, id: "id" });
	 *   return () => composite.unregisterItem("id");
	 * }, []);
	 */
	registerItem: ( item: Item ) => void;
	/**
	 * Unregisters a composite item.
	 * @example
	 * const ref = React.useRef();
	 * const composite = useCompositeState();
	 * React.useEffect(() => {
	 *   composite.registerItem({ ref, id: "id" });
	 *   return () => composite.unregisterItem("id");
	 * }, []);
	 */
	unregisterItem: ( id: string ) => void;
	/**
	 * Registers a composite group.
	 * @example
	 * const ref = React.useRef();
	 * const composite = useCompositeState();
	 * React.useEffect(() => {
	 *   composite.registerGroup({ ref, id: "id" });
	 *   return () => composite.unregisterGroup("id");
	 * }, []);
	 */
	registerGroup: ( group: Group ) => void;
	/**
	 * Unregisters a composite group.
	 * @example
	 * const ref = React.useRef();
	 * const composite = useCompositeState();
	 * React.useEffect(() => {
	 *   composite.registerGroup({ ref, id: "id" });
	 *   return () => composite.unregisterGroup("id");
	 * }, []);
	 */
	unregisterGroup: ( id: string ) => void;
	/**
	 * Moves focus to a given item ID.
	 * @example
	 * const composite = useCompositeState();
	 * composite.move("item-2"); // focus item 2
	 */
	move: ( id: string | null ) => void;
	/**
	 * Moves focus to the next item.
	 */
	next: ( unstable_allTheWay?: boolean ) => void;
	/**
	 * Moves focus to the previous item.
	 */
	previous: ( unstable_allTheWay?: boolean ) => void;
	/**
	 * Moves focus to the item above.
	 */
	up: ( unstable_allTheWay?: boolean ) => void;
	/**
	 * Moves focus to the item below.
	 */
	down: ( unstable_allTheWay?: boolean ) => void;
	/**
	 * Moves focus to the first item.
	 */
	first: () => void;
	/**
	 * Moves focus to the last item.
	 */
	last: () => void;
	/**
	 * Sorts the `composite.items` based on the items position in the DOM. This
	 * is especially useful after modifying the composite items order in the DOM.
	 * Most of the time, though, you don't need to manually call this function as
	 * the re-ordering happens automatically.
	 */
	sort: () => void;
	/**
	 * Sets `virtual`.
	 */
	unstable_setVirtual: React.Dispatch<
		React.SetStateAction< CompositeState[ 'unstable_virtual' ] >
	>;
	/**
	 * Sets `rtl`.
	 * @example
	 * const composite = useCompositeState({ rtl: true });
	 * composite.setRTL(false);
	 */
	setRTL: React.Dispatch< React.SetStateAction< CompositeState[ 'rtl' ] > >;
	/**
	 * Sets `orientation`.
	 */
	setOrientation: React.Dispatch<
		React.SetStateAction< CompositeState[ 'orientation' ] >
	>;
	/**
	 * Sets `currentId`. This is different from `composite.move` as this only
	 * updates the `currentId` state without moving focus. When the composite
	 * widget gets focused by the user, the item referred by the `currentId`
	 * state will get focus.
	 * @example
	 * const composite = useCompositeState({ currentId: "item-1" });
	 * // Updates `composite.currentId` to `item-2`
	 * composite.setCurrentId("item-2");
	 */
	setCurrentId: React.Dispatch<
		React.SetStateAction< CompositeState[ 'currentId' ] >
	>;
	/**
	 * Sets `loop`.
	 */
	setLoop: React.Dispatch< React.SetStateAction< CompositeState[ 'loop' ] > >;
	/**
	 * Sets `wrap`.
	 */
	setWrap: React.Dispatch< React.SetStateAction< CompositeState[ 'wrap' ] > >;
	/**
	 * Sets `shift`.
	 */
	setShift: React.Dispatch<
		React.SetStateAction< CompositeState[ 'shift' ] >
	>;
	/**
	 * Resets to initial state.
	 * @example
	 * // On initial render, currentId will be item-1 and loop will be true
	 * const composite = useCompositeState({
	 *   currentId: "item-1",
	 *   loop: true,
	 * });
	 * // On next render, currentId will be item-2 and loop will be false
	 * composite.setCurrentId("item-2");
	 * composite.setLoop(false);
	 * // On next render, currentId will be item-1 and loop will be true
	 * composite.reset();
	 */
	reset: () => void;
	/**
	 * Sets `includesBaseElement`.
	 * @private
	 */
	unstable_setIncludesBaseElement: React.Dispatch<
		React.SetStateAction< CompositeState[ 'unstable_includesBaseElement' ] >
	>;
	/**
	 * Sets `hasActiveWidget`.
	 * @private
	 */
	unstable_setHasActiveWidget: React.Dispatch<
		React.SetStateAction< CompositeState[ 'unstable_hasActiveWidget' ] >
	>;
};

export type CompositeStateReturn = IdStateReturn &
	CompositeState &
	CompositeActions;
