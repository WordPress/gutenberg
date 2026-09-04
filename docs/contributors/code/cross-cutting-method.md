# Cross-cutting Method

Use this method when a change crosses more than one Gutenberg boundary, such as editor state, saved content, REST requests, styles, generated files, documentation, or release artifacts.

Follow changed values and state across their complete lifecycle:

```text
input -> validation -> state/store -> serialization or request
      -> async completion/error -> rendered output -> cleanup/recovery
```

At each affected boundary, check:

-   whether absent, empty, `false`, `null`, and `undefined` retain their intended meanings;
-   whether authorization and validation occur before side effects;
-   whether loading, empty, success, failure, cancellation, and retry states are distinguishable;
-   whether old public consumers or stored content remain valid;
-   whether keyboard, pointer, screen-reader, RTL, narrow-viewport, and reduced-motion behavior remains equivalent where relevant;
-   whether tests exercise observable behavior and would fail without the fix;
-   whether metadata, types, docs, changelogs, generated output, and published artifacts agree with runtime behavior.

Check both editor and frontend behavior for block and style changes.
