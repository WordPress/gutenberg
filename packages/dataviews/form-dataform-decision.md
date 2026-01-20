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

Don’t use `DataForm` when the goal is to authenticate a user (collect credentials and submit once). Instead, use more primitive components like `InputControl` and `RadioControl`.

### Search form

-   **Path**: Path A (action/flow)
-   **Complexity**: Simple (1-2 fields)
-   **Layout**: Simple horizontal or vertical
-   **Validation**: Not required (search can accept any input)
-   **Decision**: Use components from `@wordpress/ui` (like `Field`, `Input`, `Button`)

Let users define search criteria to find items in a dataset, from simple keyword search to advanced filters (status, author, date ranges, taxonomy, etc.). Instead, use `SearchControl` and other components related to the search features, along with the data the search is searching.

### Post editor

-   **Path**: Path B (editing data object)
-   **Complexity**: Complex (many fields)
-   **Layout**: Panels, grouped fields
-   **Validation**: Advanced (async, cross-field)
-   **Decision**: Use `DataForm`

Let editors manage structured fields associated with a post (custom fields/meta, attributes, taxonomies, editorial details) alongside the main content. `DataForm` standardizes how those metadata fields are displayed, edited, and validated, while keeping the underlying post/meta data model consistent.

### Media editing

-   **Path**: Path B (editing data object)
-   **Complexity**: Complex (metadata, alt text, etc.)
-   **Layout**: Panels or cards
-   **Validation**: Advanced
-   **Decision**: Use `DataForm`

Provide a focused details panel/page for a single media item where users can view and edit metadata (alt text, caption, credit/license, organization fields). `DataForm` supplies a consistent editing experience and validation for these fields, while the product handles saving back to the media record.

### Simple settings page

-   **Path**: Path B (editing data object)
-   **Complexity**: Simple (few fields)
-   **Layout**: Simple vertical
-   **Validation**: Basic
-   **Decision**: Use `DataForm` (since it's editing a data object, even if simple)

Provide a lightweight screen to edit a small number of related configuration values (usually one section, minimal grouping). `DataForm` renders a straightforward layout from a short field list, enabling quick edits and predictable updates that the product can save as one settings object.

### Complex settings page

-   **Path**: Path B (editing data object)
-   **Complexity**: Complex (many fields, grouped)
-   **Layout**: Panels or cards
-   **Validation**: Advanced (dependencies, async)
-   **Decision**: Use `DataForm`

Provide an organized, scalable interface for editing many settings with clear grouping, conditional structure, and consistent validation—often spanning multiple categories (e.g., General, Security, Integrations, Notifications). `DataForm` is used to define fields once and control the screen structure via the form layout (sections/panels/rows/cards), while emitting granular updates so the product can manage dependencies, validation state, and save workflows.

---

## When in doubt…

**Quick reference:**

-   **No data object + No validation** → `@wordpress/ui` components (`Field`, `Input`, `Button`)
-   **No data object + Validation needed** → `validated` family from `@wordpress/components`
-   **Editing data object** → `DataForm` (regardless of complexity)

When the requirements are borderline, start with the simpler approach and migrate to a more complex solution if you find yourself needing advanced features.