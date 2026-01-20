# When to use DataForm

It can be difficult to determine when to use `DataForm` versus building a form with components from `@wordpress/ui` or the `validated` family of components from `@wordpress/components`. The decision should be based on the complexity of your form, the data model you're working with, and the validation requirements.

Here is a decision tree to help identify which approach is the right choice.

## 1. Ask first: are you editing a data object?

Is this form editing an existing data object (like a post, media item, user, or settings object) that gets updated incrementally?

-   If **no** → see [Path A: Action/flow forms](#path-a-actionflow-forms)
-   If **yes** → see [Path B: Editing data objects](#path-b-editing-data-objects)

---

## Path A: Action/flow forms

Use this path when your form represents an action or flow (login, search, contact, submit) rather than editing a data object.

### Do you need validation?

Does your form need validation (required fields, format validation, custom validation rules)?

-   If **yes** → use the `validated` family of components from `@wordpress/components` (like `ValidatedInputControl`, `ValidatedTextControl`, `ValidatedSelectControl`, etc.). These components extend WordPress components with HTML5 Constraint Validation API support.
-   If **no** → use components from `@wordpress/ui` (like `Field`, `Input`, `Button`, etc.). These provide a clean, accessible form structure without validation overhead.

### Characteristics of action/flow forms

-   Data is submitted directly via form submission
-   No incremental updates needed
-   Form state is temporary (not persisted until submission)
-   Simple layouts are typically sufficient

*E.g. Login forms, search forms, contact forms, wizards*

---

## Path B: Editing data objects

Use this path when your form edits an existing data object that gets updated incrementally.

### Use DataForm

`DataForm` is designed for editing structured data objects. Use it when:

-   Editing existing data objects (posts, media, users, settings, etc.)
-   Incremental updates via `onChange` callback
-   Data persists as user edits
-   Part of a data management interface

### Complexity considerations

#### Simple forms (2-5 fields)

`DataForm` works well even for simple forms when editing data objects, as it provides the proper data model pattern with incremental updates.

*E.g. Simple post editing, basic media metadata editing*

#### Complex forms (many fields, advanced features)

`DataForm` excels when you need:

-   Many fields (typically 6+)
-   Complex layouts (panels, cards, grouped fields, side-by-side labels)
-   Advanced validation (async validation, cross-field validation, custom rules)
-   Conditional field visibility based on other field values
-   Field dependencies and relationships

*E.g. Post editor, media editing, complex settings pages, data management interfaces*

### Layout options

`DataForm` supports various layouts:

-   **Panel layout** – Fields organized in collapsible sections
-   **Card layout** – Fields grouped in visual cards
-   **Row layout** – Fields arranged horizontally
-   **Details layout** – Summary/details pattern for nested information
-   **Side-by-side labels** – Labels positioned next to fields rather than above
-   **Simple vertical layout** – Standard stacked fields

### Validation capabilities

`DataForm` supports:

-   **Basic validation** – HTML5 validation attributes and simple client-side checks
-   **Advanced validation** – Async validation, cross-field validation, custom rules, field dependencies, and real-time validation feedback

---

## Examples

### Login form

-   **Path**: Path A (action/flow)
-   **Complexity**: Simple (2-3 fields)
-   **Layout**: Simple vertical
-   **Validation**: Required (username/email and password validation)
-   **Decision**: Use `validated` family of components from `@wordpress/components`

### Search form

-   **Path**: Path A (action/flow)
-   **Complexity**: Simple (1-2 fields)
-   **Layout**: Simple horizontal or vertical
-   **Validation**: Not required (search can accept any input)
-   **Decision**: Use components from `@wordpress/ui` (like `Field`, `Input`, `Button`)

### Post editor

-   **Path**: Path B (editing data object)
-   **Complexity**: Complex (many fields)
-   **Layout**: Panels, grouped fields
-   **Validation**: Advanced (async, cross-field)
-   **Decision**: Use `DataForm`

### Media editing

-   **Path**: Path B (editing data object)
-   **Complexity**: Complex (metadata, alt text, etc.)
-   **Layout**: Panels or cards
-   **Validation**: Advanced
-   **Decision**: Use `DataForm`

### Simple settings page

-   **Path**: Path B (editing data object)
-   **Complexity**: Simple (few fields)
-   **Layout**: Simple vertical
-   **Validation**: Basic
-   **Decision**: Use `DataForm` (since it's editing a data object, even if simple)

### Complex settings page

-   **Path**: Path B (editing data object)
-   **Complexity**: Complex (many fields, grouped)
-   **Layout**: Panels or cards
-   **Validation**: Advanced (dependencies, async)
-   **Decision**: Use `DataForm`

---

## When in doubt…

**Quick reference:**

-   **No data object + No validation** → `@wordpress/ui` components (`Field`, `Input`, `Button`)
-   **No data object + Validation needed** → `validated` family from `@wordpress/components`
-   **Editing data object** → `DataForm` (regardless of complexity)

When the requirements are borderline, start with the simpler approach and migrate to a more complex solution if you find yourself needing advanced features.
