# Overview

**Title:** Fetch template previews when the selected template changes

**Description:**

This replaces preview data selected from a large preloaded response with a
focused REST request. It reduces editor boot payload and keeps the preview in
sync with the selected template.

## Testing instructions

1. Open the editor.
2. Select several templates and confirm each preview loads.
3. Confirm the spinner disappears after each request.

## Changed files

- `packages/editor/src/hooks/use-template-preview.js`
- `packages/editor/src/hooks/test/use-template-preview.js`

## Diff

```diff
diff --git a/packages/editor/src/hooks/use-template-preview.js b/packages/editor/src/hooks/use-template-preview.js
@@ -8,14 +8,22 @@ import { useSelect } from '@wordpress/data';
 export function useTemplatePreview( templateId ) {
-    const template = useSelect(
-        ( select ) => select( coreStore ).getEntityRecord( 'postType', 'wp_template', templateId ),
-        [ templateId ]
-    );
+    const [ template, setTemplate ] = useState();
+    const [ isLoading, setIsLoading ] = useState( false );
+
+    useEffect( () => {
+        setIsLoading( true );
+        apiFetch( { path: `/wp/v2/templates/${ templateId }` } )
+            .then( ( result ) => setTemplate( result ) )
+            .finally( () => setIsLoading( false ) );
+    }, [ templateId ] );

-    return template;
+    return { template, isLoading };
 }
diff --git a/packages/editor/src/hooks/test/use-template-preview.js b/packages/editor/src/hooks/test/use-template-preview.js
@@ -18,6 +18,13 @@ describe( 'useTemplatePreview', () => {
+    it( 'loads the selected template', async () => {
+        apiFetch.mockResolvedValue( { id: 'theme//home' } );
+        const { result } = renderHook( () => useTemplatePreview( 'theme//home' ) );
+        await waitFor( () => expect( result.current.template.id ).toBe( 'theme//home' ) );
+    } );
 } );
```

The request mock resolves immediately. There is no test that changes
`templateId` while a previous request is pending.
