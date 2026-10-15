import { __, _x, sprintf } from '@wordpress/i18n';
import { check, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

function getStateOptions( states ) {
	return [
		{ label: __( 'Default' ), value: 'default' },
		...states.map( ( state ) => ( {
			label: state.label,
			value: state.value,
		} ) ),
	];
}

/**
 * Renders one group of state options (Viewport, Item or Pseudo state) inside
 * the State dropdown.
 *
 * @param {Object}                  props               Component props.
 * @param {string}                  props.label         Visible group label.
 * @param {string}                  props.keyPrefix     React key namespace for the group's items.
 * @param {Array}                   props.options       Options to render, each with `value` and `label`.
 * @param {string}                  props.selectedValue Currently selected value within this group.
 * @param {(value: string) => void} props.onChange      Called with the chosen option value.
 * @param {() => void}              props.onClose       Closes the dropdown.
 * @param {boolean}                 props.closeOnSelect Whether choosing an option closes the dropdown.
 * @return {React.JSX.Element} Menu group.
 */
function StateMenuGroup( {
	label,
	keyPrefix,
	options,
	selectedValue,
	onChange,
	onClose,
	closeOnSelect,
} ) {
	return (
		<MenuGroup label={ label }>
			{ options.map( ( option ) => (
				<MenuItem
					key={ `${ keyPrefix }-${ option.value }` }
					onClick={ () => {
						onChange?.( option.value );
						if ( closeOnSelect ) {
							onClose();
						}
					} }
					icon={ selectedValue === option.value ? check : null }
				>
					{ option.label }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

/**
 * State control for managing viewport, custom and pseudo-state styles.
 * Displays a dropdown menu with separate groups for each selector.
 *
 * Custom states are states a block declares a selector for, such as
 * Navigation Link's `-current` for the current menu item.
 *
 * @param {Object}                  props                       Component props.
 * @param {Array}                   [props.viewportStates]      Array of available viewport states.
 * @param {Array}                   [props.customStates]        Array of available custom states.
 * @param {Array}                   [props.pseudoStates]        Array of available pseudo states.
 * @param {string}                  [props.viewportValue]       Currently selected viewport value.
 * @param {string}                  [props.customStateValue]    Currently selected custom state value.
 * @param {string}                  [props.pseudoStateValue]    Currently selected pseudo state value.
 * @param {(value: string) => void} [props.onChangeViewport]    Callback when viewport selection changes.
 * @param {(value: string) => void} [props.onChangeCustomState] Callback when custom state selection changes.
 * @param {(value: string) => void} [props.onChangePseudoState] Callback when pseudo state selection changes.
 * @param {boolean}                 [props.showText]            Whether to show text label on the toggle. Default true.
 * @param {Object}                  [props.popoverProps]        Popover props for the dropdown menu.
 * @param {React.ReactNode}         [props.children]            Optional menu content rendered after the state groups.
 * @return {React.JSX.Element|null} State control component.
 */
export default function StateControl( {
	viewportStates = [],
	customStates = [],
	pseudoStates = [],
	viewportValue = 'default',
	customStateValue = 'default',
	pseudoStateValue = 'default',
	onChangeViewport,
	onChangeCustomState,
	onChangePseudoState,
	showText = true,
	popoverProps = {},
	children,
} ) {
	const groups = [
		{
			keyPrefix: 'viewport',
			label: __( 'Viewport' ),
			states: viewportStates,
			selectedValue: viewportValue,
			onChange: onChangeViewport,
		},
		{
			keyPrefix: 'custom',
			label: _x(
				'Item',
				'Group of block style states such as "Current"'
			),
			states: customStates,
			selectedValue: customStateValue,
			onChange: onChangeCustomState,
		},
		{
			keyPrefix: 'pseudo',
			label: __( 'Pseudo state' ),
			states: pseudoStates,
			selectedValue: pseudoStateValue,
			onChange: onChangePseudoState,
		},
	]
		.filter( ( group ) => group.states.length > 0 )
		.map( ( group ) => ( {
			...group,
			options: getStateOptions( group.states ),
		} ) );

	if ( ! groups.length ) {
		return null;
	}

	const triggerLabel = __( 'States' );
	const activeStates = groups.flatMap(
		( { keyPrefix, options, selectedValue } ) => {
			if ( selectedValue === 'default' ) {
				return [];
			}
			const selectedOption = options.find(
				( option ) => option.value === selectedValue
			);
			return selectedOption
				? [
						{
							key: `${ keyPrefix }-${ selectedOption.value }`,
							label: selectedOption.label,
						},
					]
				: [];
		}
	);

	const currentStateLabel = activeStates.length
		? activeStates.map( ( state ) => state.label ).join( ', ' )
		: __( 'Default' );
	const icon = showText ? chevronDown : moreVertical;
	const toggleProps = showText
		? { size: 'compact', iconPosition: 'right' }
		: { size: 'small' };
	// Keep the menu open while there are other groups or items to pick from.
	const closeOnSelect = groups.length === 1 && ! children;

	return (
		<Stack
			direction="column"
			gap="sm"
			align="flex-end"
			className="block-editor-global-styles-state-control"
		>
			<DropdownMenu
				icon={ icon }
				label={
					showText
						? triggerLabel
						: sprintf(
								/* translators: %s: Current state (e.g. "Hover", "Focus") */
								__( 'State: %s' ),
								currentStateLabel
							)
				}
				popoverProps={ {
					placement: 'right-start',
					...popoverProps,
				} }
				text={ showText ? triggerLabel : undefined }
				toggleProps={ toggleProps }
			>
				{ ( { onClose } ) => (
					<>
						{ groups.map( ( group ) => (
							<StateMenuGroup
								key={ group.keyPrefix }
								label={ group.label }
								keyPrefix={ group.keyPrefix }
								options={ group.options }
								selectedValue={ group.selectedValue }
								onChange={ group.onChange }
								onClose={ onClose }
								closeOnSelect={ closeOnSelect }
							/>
						) ) }
						{ children }
					</>
				) }
			</DropdownMenu>
		</Stack>
	);
}
