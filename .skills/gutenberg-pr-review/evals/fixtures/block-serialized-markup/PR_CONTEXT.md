# Overview

**Title:** Normalize Call to Action alignment classes

**Description:**

This makes the Call to Action block use the component naming convention already
used by its editor styles. The visual result is unchanged. Existing content is
not expected to be affected because the attribute and rendered alignment value
are unchanged.

## Discussion

**Reviewer:** Does changing the class emitted by `save` require a Block API
version bump?

**Author:** I do not think so. The block already uses API version 3 and this is
only a CSS naming cleanup.

## Changed files

- `packages/block-library/src/call-to-action/save.js`
- `packages/block-library/src/call-to-action/style.scss`
- `packages/block-library/src/call-to-action/test/save.js`

## Diff

```diff
diff --git a/packages/block-library/src/call-to-action/save.js b/packages/block-library/src/call-to-action/save.js
@@ -18,7 +18,7 @@ export default function save( { attributes } ) {
     const { textAlign, url, text } = attributes;
     const blockProps = useBlockProps.save( {
-        className: `has-text-align-${ textAlign }`,
+        className: `is-aligned-${ textAlign }`,
     } );

     return (
diff --git a/packages/block-library/src/call-to-action/style.scss b/packages/block-library/src/call-to-action/style.scss
@@ -7,7 +7,7 @@
 .wp-block-call-to-action {
-    &.has-text-align-center {
+    &.is-aligned-center {
         justify-content: center;
     }
 }
diff --git a/packages/block-library/src/call-to-action/test/save.js b/packages/block-library/src/call-to-action/test/save.js
@@ -22,7 +22,7 @@ describe( 'save', () => {
     expect( render( attributes ) ).toEqual(
-        '<div class="wp-block-call-to-action has-text-align-center">...</div>'
+        '<div class="wp-block-call-to-action is-aligned-center">...</div>'
     );
 } );
```

There is no `deprecated.js` entry or fixture containing markup produced by the
previous implementation.
