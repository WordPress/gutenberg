/**
 * `@wordpress/use-import-as` aliases for `@wordpress/components` exports whose
 * names collide with `@wordpress/ui` exports.
 *
 * @type {Record<string, string>}
 */
export default {
	__experimentalText: 'WCText',
	// wp-ui Autocomplete is not a replacement for wp-components Autocomplete, but we need to avoid name clashes.
	Autocomplete: 'WCAutocomplete',
	Badge: 'WCBadge',
	Card: 'WCCard',
	CheckboxControl: 'WCCheckboxControl',
	Icon: 'WCIcon',
	IconButton: 'WCIconButton',
	__experimentalInputControl: 'WCInputControl',
	__experimentalItemGroup: 'WCItemGroup',
	Menu: 'WCMenu',
	Notice: 'WCNotice',
	Popover: 'WCPopover',
	__experimentalRadio: 'WCRadio',
	__experimentalRadioGroup: 'WCRadioGroup',
	SelectControl: 'WCSelectControl',
	Spinner: 'WCSpinner',
	Tabs: 'WCTabs',
	TextareaControl: 'WCTextareaControl',
	Tooltip: 'WCTooltip',
	ValidatedInputControl: 'WCValidatedInputControl',
	ValidatedTextareaControl: 'WCValidatedTextareaControl',
	VisuallyHidden: 'WCVisuallyHidden',
};
