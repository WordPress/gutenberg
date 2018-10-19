# ServerSideRender

This utility component is a wrapper for the generic ServerSideRender in `@wordpress/components`. It adds the `post_id` parameter to the `urlQueryArgs` prop of the wrapped component. Use this component to ensure that the global `$post` object is set up properly in the server-side `render_callback` when rendering within the editor.
