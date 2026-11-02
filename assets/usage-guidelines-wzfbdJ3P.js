import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,r,u as i}from"./blocks-Bi8bw4xb.js";import{t as a}from"./jsx-runtime-BxZPLZy3.js";import{i as o,r as s}from"./react-sPqhvIIV.js";import{a as c,c as l,i as u,n as d,o as f,r as p,s as m,t as h}from"./usage-guidelines.story-CNEf302k.js";function _createMdxContent(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h1:`h1`,h2:`h2`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...o(),...e.components};return(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(i,{of:l}),`
`,(0,g.jsx)(t.h1,{id:`menu-usage-guidelines`,children:`Menu usage guidelines`}),`
`,(0,g.jsx)(t.p,{children:`Choose between Menu, Select, and Autocomplete based on what the options represent and whether users need to search them.`}),`
`,(0,g.jsxs)(t.blockquote,{children:[`
`,(0,g.jsx)(t.p,{children:`If the trigger represents a current value and opens choices for replacing that value, use Select. If the trigger opens commands, actions, or navigation destinations, use Menu. If users need to type to filter a menu-like list of commands or suggestions, use Autocomplete.`}),`
`]}),`
`,(0,g.jsx)(t.h2,{id:`popup-widths`,children:`Popup widths`}),`
`,(0,g.jsxs)(t.p,{children:[(0,g.jsx)(t.code,{children:`Menu.Popup`}),` accepts a `,(0,g.jsx)(t.code,{children:`width`}),` prop. The `,(0,g.jsx)(t.code,{children:`sm`}),`, `,(0,g.jsx)(t.code,{children:`md`}),`, and `,(0,g.jsx)(t.code,{children:`lg`}),` presets size the popup to its content up to the corresponding surface width token. The default is `,(0,g.jsx)(t.code,{children:`sm`}),`, which sets a 320px maximum width. Submenus use their own `,(0,g.jsx)(t.code,{children:`width`}),` prop and also default to `,(0,g.jsx)(t.code,{children:`sm`}),`.`]}),`
`,(0,g.jsxs)(t.p,{children:[`Use `,(0,g.jsx)(t.code,{children:`content`}),` to let the popup grow up to the available viewport width, `,(0,g.jsx)(t.code,{children:`anchor`}),` to match the trigger width, or `,(0,g.jsx)(t.code,{children:`available`}),` to fill the available width. All presets respect Menu's minimum width, which defaults to 160px, and the existing `,(0,g.jsx)(t.code,{children:`--wp-ui-menu-min-width`}),` and `,(0,g.jsx)(t.code,{children:`--wp-ui-menu-max-width`}),` overrides. A consumer can still set a fixed width with `,(0,g.jsx)(t.code,{children:`className`}),` or `,(0,g.jsx)(t.code,{children:`style`}),`.`]}),`
`,(0,g.jsx)(t.h2,{id:`quick-reference`,children:`Quick reference`}),`
`,(0,g.jsx)(n,{children:`
| Goal | Component | Expected behavior |
| --- | --- | --- |
| Choose one predefined value | [SelectControl](?path=/docs/design-system-components-form-selectcontrol--docs) | The trigger represents the current value. Choosing an option replaces it. |
| Build a custom value-selection control | [Select](?path=/docs/design-system-components-form-primitives-select--docs) | The primitives provide a custom composition while preserving Select semantics. |
| Offer commands, actions, or destinations | [Menu](?path=/docs/design-system-components-menu--docs) | Activating an item runs a command, opens a submenu, or navigates to a destination. |
| Search commands or suggestions with free-form input | [Autocomplete](?path=/docs/design-system-components-form-primitives-autocomplete--docs) | Typing filters the suggestions while focus remains in the input. |
| Change settings within a broader command menu | [Menu](?path=/docs/design-system-components-menu--docs) | Checkbox items toggle independent states. Radio items choose one state within a group. |
`}),`
`,(0,g.jsxs)(t.h2,{id:`use-selectcontrol-to-choose-a-value`,children:[`Use `,(0,g.jsx)(t.code,{children:`SelectControl`}),` to choose a value`]}),`
`,(0,g.jsxs)(t.p,{children:[`Use `,(0,g.jsx)(t.a,{href:`?path=/docs/design-system-components-form-selectcontrol--docs`,children:`SelectControl`}),` when choosing one predefined value is the control's primary purpose. The selected value is often submitted as part of a form, but form submission does not define Select semantics.`]}),`
`,(0,g.jsx)(t.p,{children:`The trigger should represent the current value. The popup options should represent the available replacement values, not commands or navigation destinations.`}),`
`,(0,g.jsxs)(t.p,{children:[`Use the lower-level `,(0,g.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-select--docs`,children:`Select`}),` primitives only when a custom composition cannot be expressed with `,(0,g.jsx)(t.code,{children:`SelectControl`}),`.`]}),`
`,(0,g.jsx)(r,{of:f}),`
`,(0,g.jsxs)(t.h2,{id:`use-menu-for-commands-and-destinations`,children:[`Use `,(0,g.jsx)(t.code,{children:`Menu`}),` for commands and destinations`]}),`
`,(0,g.jsxs)(t.p,{children:[`Use `,(0,g.jsx)(t.code,{children:`Menu.Item`}),` for commands or actions. Use `,(0,g.jsx)(t.code,{children:`Menu.LinkItem`}),` for navigation destinations. Activating a regular item usually performs its command and closes the menu.`]}),`
`,(0,g.jsx)(r,{of:u}),`
`,(0,g.jsxs)(t.h2,{id:`use-autocomplete-when-users-need-to-search`,children:[`Use `,(0,g.jsx)(t.code,{children:`Autocomplete`}),` when users need to search`]}),`
`,(0,g.jsxs)(t.p,{children:[`Use `,(0,g.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-autocomplete--docs`,children:`Autocomplete`}),` for a menu-like list of commands or suggestions that users filter by typing. Unlike `,(0,g.jsx)(t.code,{children:`Menu`}),`, focus remains in a text input while users navigate the suggestions.`]}),`
`,(0,g.jsxs)(t.p,{children:[`Autocomplete accepts free-form text. If the control must contain one predefined value, use `,(0,g.jsx)(t.code,{children:`SelectControl`}),` or the lower-level `,(0,g.jsx)(t.code,{children:`Select`}),` primitives instead.`]}),`
`,(0,g.jsx)(r,{of:h}),`
`,(0,g.jsx)(t.h2,{id:`use-checked-items-for-settings-within-a-menu`,children:`Use checked items for settings within a menu`}),`
`,(0,g.jsxs)(t.p,{children:[`Use `,(0,g.jsx)(t.code,{children:`Menu.CheckboxItem`}),` for independent states, such as showing or hiding individual table columns.`]}),`
`,(0,g.jsxs)(t.p,{children:[`Use `,(0,g.jsx)(t.code,{children:`Menu.RadioItem`}),` within `,(0,g.jsx)(t.code,{children:`Menu.RadioGroup`}),` for mutually exclusive states, such as choosing one density or view mode within a broader command menu.`]}),`
`,(0,g.jsxs)(t.p,{children:[(0,g.jsx)(t.code,{children:`Menu.RadioGroup`}),` already provides grouping. Put `,(0,g.jsx)(t.code,{children:`Menu.GroupLabel`}),` inside it to label the radio group. Do not wrap it in `,(0,g.jsx)(t.code,{children:`Menu.Group`}),` or put `,(0,g.jsx)(t.code,{children:`Menu.Group`}),` inside it. This also applies to combining the two components with the `,(0,g.jsx)(t.code,{children:`render`}),` prop. A label in an outer group does not label the inner group. Development builds throw an error for either nesting direction, including through wrapper components.`]}),`
`,(0,g.jsx)(t.pre,{children:(0,g.jsx)(t.code,{className:`language-tsx`,children:`<Menu.RadioGroup defaultValue="compact">
	<Menu.GroupLabel>Density</Menu.GroupLabel>
	<Menu.RadioItem value="compact">
		<Menu.ItemLabel>Compact</Menu.ItemLabel>
	</Menu.RadioItem>
	<Menu.RadioItem value="comfortable">
		<Menu.ItemLabel>Comfortable</Menu.ItemLabel>
	</Menu.RadioItem>
</Menu.RadioGroup>
`})}),`
`,(0,g.jsxs)(t.p,{children:[`Use `,(0,g.jsx)(t.code,{children:`Menu.Group`}),` for related commands, links, or checkbox items. `,(0,g.jsx)(t.code,{children:`Menu.Group`}),` and `,(0,g.jsx)(t.code,{children:`Menu.RadioGroup`}),` can be siblings in the same popup. Each submenu has its own groups.`]}),`
`,(0,g.jsxs)(t.p,{children:[`Prefer consistent prefix icon usage within each group. See `,(0,g.jsx)(t.a,{href:`#add-prefix-icons`,children:`Add prefix icons`}),` for recommendations and examples.`]}),`
`,(0,g.jsx)(r,{of:d}),`
`,(0,g.jsxs)(t.p,{children:[`Do not use checked menu items only to recreate a Select. If choosing a value is the whole purpose of the control, use `,(0,g.jsx)(t.code,{children:`SelectControl`}),`, even when the options could look like radio menu items.`]}),`
`,(0,g.jsx)(t.h2,{id:`disable-the-trigger-or-individual-items`,children:`Disable the trigger or individual items`}),`
`,(0,g.jsxs)(t.p,{children:[`Set `,(0,g.jsx)(t.code,{children:`disabled`}),` on `,(0,g.jsx)(t.code,{children:`Menu.Trigger`}),` when the menu cannot be opened, such as when no actions are available. Set `,(0,g.jsx)(t.code,{children:`disabled`}),` on individual items when their actions are unavailable. Disabling the trigger does not disable items in an already open menu.`]}),`
`,(0,g.jsxs)(t.p,{children:[`Disabling only the trigger lets users dismiss a menu that was open when the trigger became disabled. For submenus, set `,(0,g.jsx)(t.code,{children:`disabled`}),` on `,(0,g.jsx)(t.code,{children:`Menu.SubmenuTrigger`}),`. Neither `,(0,g.jsx)(t.code,{children:`Menu.Root`}),` nor `,(0,g.jsx)(t.code,{children:`Menu.SubmenuRoot`}),` supports `,(0,g.jsx)(t.code,{children:`disabled`}),`.`]}),`
`,(0,g.jsxs)(t.p,{children:[`When rendering an `,(0,g.jsx)(t.code,{children:`@wordpress/components`}),` `,(0,g.jsx)(t.code,{children:`Button`}),`, keep `,(0,g.jsx)(t.code,{children:`accessibleWhenDisabled`}),` on the button if it should remain focusable. Put `,(0,g.jsx)(t.code,{children:`disabled`}),` on `,(0,g.jsx)(t.code,{children:`Menu.Trigger`}),`, which passes it to the rendered button and prevents the menu from opening with the keyboard or pointer.`]}),`
`,(0,g.jsx)(t.pre,{children:(0,g.jsx)(t.code,{className:`language-tsx`,children:`import { Button } from '@wordpress/components';
import { Menu } from '@wordpress/ui';

<Menu.Root>
	<Menu.Trigger
		disabled={ isUnavailable }
		render={ <Button accessibleWhenDisabled /> }
	>
		Actions
	</Menu.Trigger>
	<Menu.Popup>
		<Menu.Item disabled={ isUnavailable } onClick={ duplicate }>
			<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
		</Menu.Item>
	</Menu.Popup>
</Menu.Root>;
`})}),`
`,(0,g.jsx)(t.h2,{id:`add-prefix-icons`,children:`Add prefix icons`}),`
`,(0,g.jsx)(t.p,{children:`Use familiar icons to help users recognize actions or give a key action useful prominence. Choose icons with a clear meaning and omit purely decorative ones.`}),`
`,(0,g.jsxs)(t.blockquote,{children:[`
`,(0,g.jsx)(t.p,{children:`Prefer icons on every item in a group, or none. If only one item needs an icon, consider whether it belongs in that group or needs its own. Prefer omitting the icon over adding unnecessary icons to the other items.`}),`
`]}),`
`,(0,g.jsx)(t.p,{children:`Mixed icon usage is supported. Labels without icons start at the same position as neighboring icons, without an empty icon space.`}),`
`,(0,g.jsxs)(t.p,{children:[`Apply the recommendation within each group and submenu. Groups can use `,(0,g.jsx)(t.code,{children:`Menu.Group`}),`, `,(0,g.jsx)(t.code,{children:`Menu.RadioGroup`}),`, or separators, and do not need headings. Different groups can make different choices. Checkbox and radio selection indicators do not count as prefix icons.`]}),`
`,(0,g.jsxs)(t.p,{children:[`Use `,(0,g.jsx)(t.code,{children:`Menu.PrefixIcon`}),` for SVG icons. Keep its default 16px size for consistency.`]}),`
`,(0,g.jsx)(t.p,{children:`In this example, the Actions group has icons and the Navigation group has none.`}),`
`,(0,g.jsx)(r,{of:p}),`
`,(0,g.jsx)(t.p,{children:`This example mixes items with and without icons. Rename starts at the same position as the Duplicate and Archive icons.`}),`
`,(0,g.jsx)(r,{of:c}),`
`,(0,g.jsx)(t.p,{children:`Prefix icons are hidden from assistive technology. Make each action clear in its label.`}),`
`,(0,g.jsx)(t.h2,{id:`keep-labels-clear-and-descriptions-rare`,children:`Keep labels clear and descriptions rare`}),`
`,(0,g.jsx)(t.p,{children:`Write short labels that users can understand on their own. Improve an unclear label before adding a description. Most items should not need one.`}),`
`,(0,g.jsxs)(t.p,{children:[`Use a brief description only for essential context the label cannot convey. For example, `,(0,g.jsx)(t.strong,{children:`Delete…`}),` might need "Also deletes all versions of this item." Do not repeat the label or explain an obvious action.`]}),`
`,(0,g.jsx)(t.p,{children:`Avoid combining a prefix icon and a description in the same item. Both add detail and can make the menu harder to scan.`}),`
`,(0,g.jsx)(t.p,{children:`Check that longer or translated labels and descriptions wrap cleanly.`}),`
`,(0,g.jsx)(t.h2,{id:`use-an-ellipsis-for-actions-that-need-more-input`,children:`Use an ellipsis for actions that need more input`}),`
`,(0,g.jsxs)(t.p,{children:[`Append an ellipsis (`,(0,g.jsx)(t.code,{children:`…`}),`) when activating an item opens another interface that requires more user input before the command can finish, such as a dialog.`]}),`
`,(0,g.jsxs)(t.ul,{children:[`
`,(0,g.jsxs)(t.li,{children:[`Use `,(0,g.jsx)(t.strong,{children:`Rename…`}),` when activation opens a dialog where the user enters a new name.`]}),`
`,(0,g.jsxs)(t.li,{children:[`Use `,(0,g.jsx)(t.strong,{children:`Delete…`}),` when activation opens a confirmation dialog that requires a decision.`]}),`
`,(0,g.jsxs)(t.li,{children:[`Use `,(0,g.jsx)(t.strong,{children:`Preferences`}),` without an ellipsis when activation completes the command by opening the preferences interface.`]}),`
`,(0,g.jsxs)(t.li,{children:[`Use `,(0,g.jsx)(t.strong,{children:`Duplicate`}),` when activation completes the command immediately.`]}),`
`,(0,g.jsxs)(t.li,{children:[`Use `,(0,g.jsx)(t.strong,{children:`Move to`}),` without an ellipsis when the item opens a submenu.`]}),`
`]}),`
`,(0,g.jsxs)(t.p,{children:[`The consumer must add the ellipsis because `,(0,g.jsx)(t.code,{children:`Menu.Item`}),` cannot infer what happens after activation. See the `,(0,g.jsx)(t.a,{href:`https://www.w3.org/WAI/ARIA/apg/patterns/menubar/`,rel:`nofollow`,children:`WAI-ARIA APG Menu and Menubar Pattern`}),` and the `,(0,g.jsx)(t.a,{href:`https://github.com/WordPress/gutenberg/issues/64555#issuecomment-5244971187`,rel:`nofollow`,children:`WordPress ellipsis guidance`}),`.`]}),`
`,(0,g.jsx)(t.h2,{id:`common-mistakes`,children:`Common mistakes`}),`
`,(0,g.jsxs)(t.ul,{children:[`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.strong,{children:`Using Menu to choose the control's only value.`}),` Use `,(0,g.jsx)(t.code,{children:`SelectControl`}),` so the trigger and options communicate value selection.`]}),`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.strong,{children:`Putting commands or links in Select.`}),` Use `,(0,g.jsx)(t.code,{children:`Menu.Item`}),` for commands and `,(0,g.jsx)(t.code,{children:`Menu.LinkItem`}),` for destinations.`]}),`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.strong,{children:`Using Menu for a large set of searchable commands.`}),` Use `,(0,g.jsx)(t.code,{children:`Autocomplete`}),` when users need to filter commands or suggestions by typing.`]}),`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.strong,{children:`Using radio items to recreate a Select.`}),` Use `,(0,g.jsx)(t.code,{children:`Menu.RadioItem`}),` only when the state belongs inside a broader command menu.`]}),`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.strong,{children:`Adding icons only for consistency.`}),` Omit unnecessary icons instead.`]}),`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.strong,{children:`Combining an icon and a description.`}),` Use only the supporting detail the item needs.`]}),`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.strong,{children:`Adding descriptions to most items.`}),` Keep labels clear and reserve descriptions for essential context.`]}),`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.strong,{children:`Adding an ellipsis to every item that opens another interface.`}),` Reserve it for commands that require more input before completion. Do not add it when opening the interface completes the command, as with `,(0,g.jsx)(t.strong,{children:`Preferences`}),`.`]}),`
`]}),`
`,(0,g.jsx)(t.h2,{id:`references`,children:`References`}),`
`,(0,g.jsxs)(t.ul,{children:[`
`,(0,g.jsx)(t.li,{children:(0,g.jsx)(t.a,{href:`https://www.w3.org/WAI/ARIA/apg/patterns/menubar/`,rel:`nofollow`,children:`WAI-ARIA APG: Menu and Menubar Pattern`})}),`
`,(0,g.jsx)(t.li,{children:(0,g.jsx)(t.a,{href:`https://www.w3.org/WAI/ARIA/apg/patterns/listbox/`,rel:`nofollow`,children:`WAI-ARIA APG: Listbox Pattern`})}),`
`,(0,g.jsx)(t.li,{children:(0,g.jsxs)(t.a,{href:`https://www.w3.org/TR/wai-aria-1.2/#menuitemcheckbox`,rel:`nofollow`,children:[`WAI-ARIA: `,(0,g.jsx)(t.code,{children:`menuitemcheckbox`}),` role`]})}),`
`,(0,g.jsx)(t.li,{children:(0,g.jsxs)(t.a,{href:`https://www.w3.org/TR/wai-aria-1.2/#menuitemradio`,rel:`nofollow`,children:[`WAI-ARIA: `,(0,g.jsx)(t.code,{children:`menuitemradio`}),` role`]})}),`
`,(0,g.jsx)(t.li,{children:(0,g.jsxs)(t.a,{href:`https://html.spec.whatwg.org/dev/form-elements.html#the-select-element`,rel:`nofollow`,children:[`HTML Standard: The `,(0,g.jsx)(t.code,{children:`select`}),` element`]})}),`
`,(0,g.jsx)(t.li,{children:(0,g.jsx)(t.a,{href:`https://base-ui.com/react/components/menu`,rel:`nofollow`,children:`Base UI: Menu`})}),`
`,(0,g.jsx)(t.li,{children:(0,g.jsx)(t.a,{href:`https://base-ui.com/react/components/select`,rel:`nofollow`,children:`Base UI: Select`})}),`
`,(0,g.jsx)(t.li,{children:(0,g.jsx)(t.a,{href:`https://base-ui.com/react/components/autocomplete`,rel:`nofollow`,children:`Base UI: Autocomplete`})}),`
`]})]})}function MDXContent(e={}){let{wrapper:t}={...o(),...e.components};return t?(0,g.jsx)(t,{...e,children:(0,g.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var g;function init_usage_guidelines(){return(init_usage_guidelines=e((()=>{g=a(),s(),t(),m()})))()}init_usage_guidelines();export{MDXContent as default};