<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   `WidgetRelevance` gains a `'medium'` tier between `'high'` and `'low'`,
    for persistent but compact visibility
    ([#81556](https://github.com/WordPress/gutenberg/pull/81556)).

### Enhancements

-   `useWidgetTypes` holds the icon slot with the stand-in while an action's
    icon reference resolves; an unresolvable reference clears it
    ([#81556](https://github.com/WordPress/gutenberg/pull/81556)).

## 0.5.0 (2026-08-12)

### New Features

-   `WidgetAction` gains envelope fields: `icon`, a registered icon name
    resolved by `useWidgetTypes` into a renderable element, and `relevance`
    (`'high' | 'low'`) ([#81275](https://github.com/WordPress/gutenberg/pull/81275)).
-   Widgets can reference their icon declaratively: `WidgetModuleRecord`
    carries a registered icon name and `useWidgetTypes` resolves it through
    the application-registered resolver (`registerIconResolver`), so
    `WidgetType.icon` always reaches hosts renderable
    ([#80969](https://github.com/WordPress/gutenberg/pull/80969)).

### Enhancements

-   Name the two forms of an action icon: `WidgetActionRecord` carries the
    registered icon name on the wire, and `WidgetAction.icon` narrows to the
    rendered element hosts receive ([#81381](https://github.com/WordPress/gutenberg/pull/81381)).

### Documentation

-   Simplify the actions doc: the accepted `href` forms in one statement and
    an absolute-URL download example ([#81272](https://github.com/WordPress/gutenberg/pull/81272)).
-   Add an Icons doc page and a `WithIconReference` story ([#80969](https://github.com/WordPress/gutenberg/pull/80969)).
-   Describe actions as verbs ([#80974](https://github.com/WordPress/gutenberg/pull/80974)).

### Internal

-   Remove obsolete dependency grouping comments as part of the repository-wide separator-free import migration. ([#81248](https://github.com/WordPress/gutenberg/pull/81248))

## 0.4.0 (2026-07-29)

### New Features

-   `WidgetTypeMetadata`: add optional `actions`, a declarative list of
    user-triggerable links a widget exposes ([#80363](https://github.com/WordPress/gutenberg/pull/80363)).

### Enhancements

-   Ship the package as a WordPress script module
    (`wpScriptModuleExports`) ([#80149](https://github.com/WordPress/gutenberg/pull/80149)).

### Documentation

-   Prefer widget-local files over `data:` URLs for action downloads ([#80510](https://github.com/WordPress/gutenberg/pull/80510)).
-   Add an Actions doc page and a `WithActions` story, and cover `actions`
    in the widget anatomy doc ([#80363](https://github.com/WordPress/gutenberg/pull/80363)).
-   Spell out the accepted field-type name syntax: lowercase kebab-case
    segments, with at most one namespace level ([#80208](https://github.com/WordPress/gutenberg/pull/80208)).

### Internal

-   Add an integration test covering named field-type resolution in
    `useWidgetTypes` ([#80208](https://github.com/WordPress/gutenberg/pull/80208)).

## 0.3.0 (2026-07-14)

### New Features

-   `WidgetAttributeField< Item >`: authoring helper narrowing a DataViews
    `Field.id` to the widget's attribute keys.
-   Field type registry: `registerFieldType` names a reusable field type,
    plain (`location`) or namespaced (`acme/rating`); `useWidgetTypes`
    resolves attributes referencing registered names into plain DataViews
    `Field` props ([#80148](https://github.com/WordPress/gutenberg/pull/80148)).

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).
-   `WidgetAttributeField`: add optional `relevance` hint (`'high' | 'low'`)
    marking attributes a host may promote to a prominent surface.
-   `WidgetModuleRecord`: add optional `category`, overlaid onto the
    metadata module's value.
-   `WidgetModuleRecord`: add optional `title`, `description`, and
    `keywords`, overlaid onto the metadata module's values. Lets a host
    supply metadata translated server-side.
-   `WidgetTypeMetadata`: add optional `help`, a declarative contextual
    note (`content` plus optional `links`) for compact surfaces such as
    tooltips. Also carried by `WidgetModuleRecord`, overlaid onto the
    metadata module's value.

### Documentation

-   Add a widget anatomy doc and lighten the widget system doc.
-   Document the `relevance` hint and `help` note across anatomy, authoring,
    and architecture docs; add an attribute-relevance diagram.
-   Add a `WithRelevance` Storybook story for attribute relevance hints.
-   Add a Field Types doc, its pipeline diagram, and a `WithFieldType`
    story ([#80148](https://github.com/WordPress/gutenberg/pull/80148)).

## 0.2.0 (2026-07-01)

## 0.1.0 (2026-06-24)

### New Features

-   Initial experimental release.
-   `<WidgetRender>`: host entry point that resolves a widget's render
    module and mounts it with the `attributes` / `setAttributes` render
    contract.
-   `useWidgetTypes( records )`: data-source-agnostic discovery hook that
    resolves widget types from host-supplied `WidgetModuleRecord[]`.
-   Contract types: `WidgetType`, `WidgetName`, `WidgetIcon`,
    `WidgetRenderProps`, `ResolveWidgetModule`, `WidgetModuleRecord`.
