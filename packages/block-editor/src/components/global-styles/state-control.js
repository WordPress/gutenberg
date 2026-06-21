/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { check, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

function buildOptions( states ) {
	return [
		{ label: __( 'Default' ), value: 'default' },
		...states.map( ( state ) => ( {
			label: state.label,
			value: state.value,
		} ) ),
	];
}

/**
 * Renders one group of state options (Viewport, Item, or Pseudo state) inside
 * the parent DropdownMenu. Extracted so the three groups share a single
 * source of truth for menu-item rendering, selected-icon, and close-on-select
 * behavior.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.label         Visible group label.
 * @param {string}   props.keyPrefix     React-key namespace for the group's items.
 * @param {Array}    props.options       Items to render (each with `value` and `label`).
 * @param {string}   props.selectedValue Currently-selected value within this group.
 * @param {Function} props.onChange      Called with the chosen option value.
 * @param {Function} props.onClose       Closes the parent DropdownMenu.
 * @param {boolean}  props.closeOnSelect Close the menu after a selection.
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
 * State control for managing viewport, custom (class-based), and pseudo-state styles.
 * Displays a dropdown menu with separate groups for each selector.
 *
 * @param {Object}   props                     Component props.
 * @param {Array}    props.viewportStates      Array of available viewport states.
 * @param {Array}    props.customStates        Array of available custom (class-based) states (e.g. `@current`).
 * @param {Array}    props.pseudoStates        Array of available pseudo states.
 * @param {string}   props.viewportValue       Currently selected viewport value.
 * @param {string}   props.customStateValue    Currently selected custom state value.
 * @param {string}   props.pseudoStateValue    Currently selected pseudo state value.
 * @param {Function} props.onChangeViewport    Callback when viewport selection changes.
 * @param {Function} props.onChangeCustomState Callback when custom state selection changes.
 * @param {Function} props.onChangePseudoState Callback when pseudo state selection changes.
 * @param {boolean}  props.showText            Whether to show text label on the toggle. Default true.
 * @param {Object}   props.popoverProps        Popover props for the dropdown menu.
 * @return {Element|null} State control component.
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
} ) {
	const viewportOptions = useMemo(
		() => buildOptions( viewportStates ),
		[ viewportStates ]
	);
	const customStateOptions = useMemo(
		() => buildOptions( customStates ),
		[ customStates ]
	);
	const pseudoStateOptions = useMemo(
		() => buildOptions( pseudoStates ),
		[ pseudoStates ]
	);

	if (
		! viewportStates.length &&
		! customStates.length &&
		! pseudoStates.length
	) {
		return null;
	}

	const triggerLabel = __( 'States' );
	const groups = [
		{
			keyPrefix: 'viewport',
			label: __( 'Viewport' ),
			options: viewportOptions,
			rawOptions: viewportStates,
			selectedValue: viewportValue,
			onChange: onChangeViewport,
		},
		{
			keyPrefix: 'custom',
			label: _x( 'Item', 'block style state group for per-item states' ),
			options: customStateOptions,
			rawOptions: customStates,
			selectedValue: customStateValue,
			onChange: onChangeCustomState,
		},
		{
			keyPrefix: 'pseudo',
			label: __( 'Pseudo state' ),
			options: pseudoStateOptions,
			rawOptions: pseudoStates,
			selectedValue: pseudoStateValue,
			onChange: onChangePseudoState,
		},
	];
	const visibleGroups = groups.filter(
		( { rawOptions } ) => rawOptions.length > 0
	);
	const activeStates = visibleGroups.flatMap(
		( { keyPrefix, options, selectedValue } ) => {
			if ( selectedValue === 'default' ) {
				return [];
			}
			const selected = options.find(
				( option ) => option.value === selectedValue
			);
			return selected
				? [
						{
							key: `${ keyPrefix }-${ selected.value }`,
							label: selected.label,
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
		? { size: 'compact', variant: 'tertiary', iconPosition: 'right' }
		: { size: 'compact', variant: 'tertiary' };

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
				{ ( { onClose } ) => {
					const closeOnSelect = visibleGroups.length <= 1;
					return (
						<>
							{ visibleGroups.map( ( group ) => (
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
						</>
					);
				} }
			</DropdownMenu>
		</Stack>
	);
}
