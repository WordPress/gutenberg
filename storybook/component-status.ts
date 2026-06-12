import type { PreparedStory } from 'storybook/internal/types';

export type ComponentStatusValue =
	| 'recommended'
	| 'use-with-caution'
	| 'not-recommended'
	| 'unaudited';

export type ComponentStatus = {
	status: ComponentStatusValue;
	whereUsed: 'global' | 'editor';
	notes?: string;
};

/**
 * Central registry of stability metadata for design system components.
 *
 * These are used in the Storybook UI to indicate the stability of a component
 * and any notes about its use.
 *
 * To update a component's status or include a new component as part of the
 * design system, include or update an entry in the object.
 */
export const COMPONENT_STATUS = {
	'@wordpress/components': {
		AlignmentMatrixControl: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		AnglePickerControl: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		Animate: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation.',
		},
		Badge: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Will be superseded by `Badge` in `@wordpress/ui`, but continue using for now.',
		},
		BaseControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `Field` in `@wordpress/ui`, but continue using for now.',
		},
		BorderBoxControl: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		BorderControl: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		BoxControl: {
			status: 'use-with-caution',
			whereUsed: 'editor',
			notes: 'This component is a fallback for themes that do not supply spacing presets. Most of the time `SpacingSizesControl` from `@wordpress/block-editor` is used instead.',
		},
		Button: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `Button` in `@wordpress/ui`, but continue using for now.',
		},
		Card: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Card` or `CollapsibleCard` from `@wordpress/ui` instead.',
		},
		CheckboxControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `CheckboxControl` in `@wordpress/ui`, but continue using for now.',
		},
		CircularOptionPicker: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Mostly intended for internal use.',
		},
		ColorIndicator: {
			status: 'recommended',
			whereUsed: 'global',
		},
		ColorPalette: {
			status: 'recommended',
			whereUsed: 'global',
		},
		ColorPicker: {
			status: 'recommended',
			whereUsed: 'global',
		},
		ComboboxControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `SearchableSelectControl` in `@wordpress/ui`, but continue using for now.',
		},
		Composite: {
			status: 'recommended',
			whereUsed: 'global',
		},
		ConfirmDialog: {
			status: 'recommended',
			whereUsed: 'global',
		},
		CustomGradientPicker: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Mostly an internal component. Use `GradientPicker` instead.',
		},
		CustomSelectControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `SelectControl` in `@wordpress/ui`, but continue using for now.',
		},
		CustomSelectControlV2: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `SelectControl` in `@wordpress/ui`. Continue using `CustomSelectControl` (v1) for now.',
		},
		DatePicker: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Consider using a `TextControl` with `type="date"` or `type="datetime-local"` instead.',
		},
		DateTimePicker: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Consider using a `TextControl` with `type="date"` or `type="datetime-local"` instead.',
		},
		Disabled: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Divider: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation.',
		},
		Draggable: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'May be deprecated.',
		},
		DropZone: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Dropdown: {
			status: 'recommended',
			whereUsed: 'global',
		},
		DropdownMenu: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'When building for the Gutenberg repo, use `Menu` instead. Otherwise, continue using for now.',
		},
		DuotonePicker: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		DuotoneSwatch: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		Elevation: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation. Use [elevation tokens](?path=/docs/foundations-design-language-elevation--page) from `@wordpress/base-styles` instead.',
		},
		ExternalLink: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Link` from `@wordpress/ui` instead, with the `openInNewTab` prop set.',
		},
		Flex: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation. For use cases not covered by `Stack` from `@wordpress/ui`, write your own CSS.',
		},
		FocalPointPicker: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		FontSizePicker: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		FormFileUpload: {
			status: 'recommended',
			whereUsed: 'global',
		},
		FormToggle: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'For standard toggles with labels, use `ToggleControl` instead.',
		},
		FormTokenField: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `SearchableChipSelect` in `@wordpress/ui`, but continue using for now.',
		},
		GradientPicker: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Grid: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation. Write your own CSS instead.',
		},
		Guide: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		HStack: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Stack` from `@wordpress/ui` instead.',
		},
		Heading: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Text` from `@wordpress/ui` instead, with the `render` prop set to the heading level element and the variant set to the visual heading size (e.g. `<Text render={ <h1 /> } variant="heading-2xl">`).',
		},
		Icon: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'When rendering SVGs, use `Icon` from `@wordpress/ui` instead.',
		},
		InputControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `InputControl` in `@wordpress/ui`, but continue using for now.',
		},
		ItemGroup: {
			status: 'recommended',
			whereUsed: 'global',
		},
		KeyboardShortcuts: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Menu: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'When building for the Gutenberg repo, use this component instead of `DropdownMenu`. Otherwise, continue using `DropdownMenu` for now.',
		},
		MenuGroup: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Subcomponent of `DropdownMenu`.',
		},
		MenuItem: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Subcomponent of `DropdownMenu`.',
		},
		MenuItemsChoice: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Subcomponent of `DropdownMenu`.',
		},
		Modal: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `Dialog` in `@wordpress/ui`, but continue using for now.',
		},
		NavigableMenu: {
			status: 'unaudited',
			whereUsed: 'global',
		},
		Navigator: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Notice: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `Notice` in `@wordpress/ui`, but continue using for now.',
		},
		NumberControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `InputControl` with `type="number"` in `@wordpress/ui`, but continue using for now.',
		},
		PaletteEdit: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		Panel: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Placeholder: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		Popover: {
			status: 'recommended',
			whereUsed: 'global',
		},
		ProgressBar: {
			status: 'recommended',
			whereUsed: 'global',
		},
		QueryControls: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		RadioControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `RadioGroupControl` in `@wordpress/ui`, but continue using for now.',
		},
		RangeControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `SliderControl` in `@wordpress/ui`, but continue using for now.',
		},
		ResizableBox: {
			status: 'recommended',
			whereUsed: 'global',
		},
		ResponsiveWrapper: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation.',
		},
		SandBox: {
			status: 'recommended',
			whereUsed: 'global',
		},
		ScrollLock: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Scrollable: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation.',
		},
		SearchControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `SearchControl` in `@wordpress/ui`, but continue using for now.',
		},
		SelectControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `SelectControl` in `@wordpress/ui`, but continue using for now.',
		},
		Shortcut: {
			status: 'recommended',
			whereUsed: 'global',
		},
		SlotFill: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Snackbar: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Spacer: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation.',
		},
		Spinner: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Surface: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation.',
		},
		TabPanel: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Tabs` from `@wordpress/ui` instead.',
		},
		TabbableContainer: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation.',
		},
		Tabs: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Tabs` from `@wordpress/ui` instead.',
		},
		Text: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Text` from `@wordpress/ui` instead.',
		},
		TextControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Prefer `InputControl` when placing buttons or icons in the prefix/suffix slots.',
		},
		TextHighlight: {
			status: 'recommended',
			whereUsed: 'global',
		},
		TextareaControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `TextareaControl` in `@wordpress/ui`, but continue using for now.',
		},
		Theme: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'This is an internal experiment and not meant for external use. Will be superseded by `@wordpress/theme`.',
		},
		TimePicker: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Consider using a `TextControl` with `type="date"` or `type="datetime-local"` instead.',
		},
		Tip: {
			status: 'unaudited',
			whereUsed: 'global',
		},
		ToggleControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `ToggleControl` in `@wordpress/ui`, but continue using for now.',
		},
		ToggleGroupControl: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `ToggleGroupControl` in `@wordpress/ui`, but continue using for now.',
		},
		Toolbar: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		ToolsPanel: {
			status: 'recommended',
			whereUsed: 'editor',
		},
		Tooltip: {
			status: 'recommended',
			whereUsed: 'global',
		},
		TreeGrid: {
			status: 'recommended',
			whereUsed: 'global',
		},
		TreeSelect: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Truncate: {
			status: 'recommended',
			whereUsed: 'global',
		},
		UnitControl: {
			status: 'recommended',
			whereUsed: 'global',
		},
		VStack: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Stack` from `@wordpress/ui` instead.',
		},
		View: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation.',
		},
		VisuallyHidden: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `VisuallyHidden` from `@wordpress/ui` instead.',
		},
		ZStack: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Planned for deprecation. Write your own CSS instead.',
		},
	},
	'@wordpress/grid': {
		DashboardGrid: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'This package is under heavy development and likely to change.',
		},
		DashboardLanes: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'This package is under heavy development and likely to change.',
		},
	},
	'@wordpress/ui': {
		AlertDialog: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Autocomplete: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, overlays compatibility, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Badge: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Button: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and text overflow behavior. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Card: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Collapsible: {
			status: 'recommended',
			whereUsed: 'global',
		},
		CollapsibleCard: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Dialog: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Drawer: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		EmptyState: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Field: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Fieldset: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Icon: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Prefer this component over the `Icon` component from `@wordpress/components` or `@wordpress/icons`.',
		},
		IconButton: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, text overflow behavior, and overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Input: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		InputControl: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		InputLayout: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Link: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Notice: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Popover: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Select: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, overlays compatibility, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Stack: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Tabs: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Text: {
			status: 'recommended',
			whereUsed: 'global',
		},
		Textarea: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		Tooltip: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
		VisuallyHidden: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
} as const satisfies Record< string, Record< string, ComponentStatus > >;

type Package = keyof typeof COMPONENT_STATUS;
type ComponentName< P extends Package > =
	keyof ( typeof COMPONENT_STATUS )[ P ];

/**
 * Look up the curated status for a component.
 *
 * @param packageName   - The npm package the component is exported from.
 * @param componentName - The canonical component name as imported.
 * @return The component's status entry.
 */
export function getComponentStatus< P extends Package >(
	packageName: P,
	componentName: ComponentName< P >
): ComponentStatus {
	return COMPONENT_STATUS[ packageName ][ componentName ] as ComponentStatus;
}

/**
 * Resolve a component's status from a Storybook story object.
 *
 * The package is derived from the story's `parameters.fileName` by assuming the
 * `packages/<dir>` convention maps to `@wordpress/<dir>`. This holds for every
 * package we currently track component status. Packages that don't follow the
 * convention simply won't match the registry and fall through to `undefined`,
 * which is the desired behavior.
 *
 * The component name is derived from the last segment of the story's `title`,
 * which matches how the component appears in the sidebar and, by convention,
 * the keys of `COMPONENT_STATUS`.
 *
 * Returns `undefined` for companion docs pages that don't reference a component
 * (i.e. whose story meta doesn't include a component property), so statuses
 * only appear on a component's primary docs page rather than on every sibling
 * page nested under its title.
 *
 * @param story - The Storybook prepared story for the docs page being rendered.
 * @return The matching status entry, or `undefined` when the story cannot be
 *         resolved to a known package component.
 */
export function getComponentStatusFromStory(
	story: PreparedStory
): ComponentStatus | undefined {
	if ( ! story.component ) {
		return undefined;
	}

	const packageName = packageFromPath( story.parameters.fileName );
	if ( ! packageName || ! ( packageName in COMPONENT_STATUS ) ) {
		return undefined;
	}

	const componentName = story.title.split( '/' ).pop();
	if ( ! componentName ) {
		return undefined;
	}

	const registry = COMPONENT_STATUS[ packageName as Package ] as Record<
		string,
		ComponentStatus
	>;
	return registry[ componentName ];
}

function packageFromPath( fileName: string | undefined ): string | undefined {
	const match = fileName?.match( /(?:^|\/)packages\/([^/]+)\// );
	return match ? `@wordpress/${ match[ 1 ] }` : undefined;
}
