# Overview

**Title:** Expose the allow-comments site setting to the editor

**Description:**

This adds a boolean REST setting used by the editor's Discussion panel. The
route uses the existing site-settings permission model and sanitizes the value
as a boolean.

## Changed files

- `lib/experimental/class-site-settings-controller.php`
- `lib/experimental/test/class-site-settings-controller-test.php`

## Diff

```diff
diff --git a/lib/experimental/class-site-settings-controller.php b/lib/experimental/class-site-settings-controller.php
@@ -32,6 +32,13 @@ public function register_routes() {
             'methods'             => WP_REST_Server::EDITABLE,
             'callback'            => array( $this, 'update_item' ),
             'permission_callback' => array( $this, 'can_edit_site_settings' ),
+            'args'                => array(
+                'allow_comments' => array(
+                    'type'              => 'boolean',
+                    'sanitize_callback' => 'rest_sanitize_boolean',
+                ),
+            ),
         )
     );
 }
@@ -61,6 +68,10 @@ public function can_edit_site_settings() {
     return current_user_can( 'edit_theme_options' );
 }

 public function update_item( WP_REST_Request $request ) {
+    if ( $request['allow_comments'] ) {
+        update_option(
+            'default_comment_status',
+            $request['allow_comments'] ? 'open' : 'closed'
+        );
+    }
+
     return $this->prepare_item();
 }
diff --git a/lib/experimental/test/class-site-settings-controller-test.php b/lib/experimental/test/class-site-settings-controller-test.php
@@ -90,6 +90,15 @@ class Site_Settings_Controller_Test extends WP_UnitTestCase {
+    public function test_updates_allow_comments() {
+        $request = new WP_REST_Request( 'POST', '/gutenberg/v1/site-settings' );
+        $request->set_param( 'allow_comments', true );
+        $response = rest_get_server()->dispatch( $request );
+
+        $this->assertSame( 200, $response->get_status() );
+        $this->assertSame( 'open', get_option( 'default_comment_status' ) );
+    }
 }
```

The test suite does not send `false` after the option has been set to `open`.
