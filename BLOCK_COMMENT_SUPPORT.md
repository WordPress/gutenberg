# Block Comment Global Attribute Implementation

## Overview

This implementation adds `blockCommentId` as a **global attribute** to all blocks to resolve the 400 error that occurs when adding block comments to blocks with `ServerSideRender` components. The error happens because the `blockCommentId` attribute is not defined server-side, causing the REST API to reject the request.

## Problem

When a block comment is added to a block with `ServerSideRender`:
1. The `blockCommentId` attribute is sent to the server
2. The server-side block registration doesn't recognize `blockCommentId` as a valid attribute
3. This causes a 400 error: `"blockCommentId is not a valid property of Object"`
4. Unlike `metadata` and `lock` attributes which are defined as global attributes, `blockCommentId` is not defined server-side

## Solution

The solution implements `blockCommentId` as a **global attribute** similar to `metadata` and `lock` attributes. This ensures that the attribute is always available for REST API validation, regardless of when blocks are registered or when the REST API request is made.

### 1. PHP Global Attribute (`lib/block-supports/block-comment.php`)

```php
// Adds blockCommentId as a global attribute to all blocks
function gutenberg_add_block_comment_global_attribute( $args, $block_type ) {
    if ( ! array_key_exists( 'blockCommentId', $args['attributes'] ) ) {
        $args['attributes']['blockCommentId'] = array(
            'type' => 'number',
        );
    }
    return $args;
}

// Register the filter to add blockCommentId to all blocks
add_filter( 'register_block_type_args', 'gutenberg_add_block_comment_global_attribute', 10, 2 );
```

### 2. JavaScript Global Attribute (`packages/block-editor/src/hooks/block-comment.js`)

```javascript
// Filters registered block settings, extending attributes to include `blockCommentId` as a global attribute
export function addBlockCommentGlobalAttribute( settings ) {
    settings.attributes = {
        ...settings.attributes,
        blockCommentId: {
            type: 'number',
        },
    };
    return settings;
}

addFilter( 'blocks.registerBlockType', 'core/blockComment/addGlobalAttribute', addBlockCommentGlobalAttribute );
```

### 3. Integration Points

- **PHP Loading**: Added to `lib/load.php` to ensure the global attribute is loaded
- **JavaScript Loading**: Added to `packages/block-editor/src/hooks/index.js` to ensure the hook is registered

## How It Works

1. **Server-Side**: The PHP filter adds `blockCommentId` as a global attribute to all blocks during registration
2. **Client-Side**: The JavaScript hook ensures all blocks have the `blockCommentId` attribute registered
3. **REST API**: When `ServerSideRender` blocks receive block comments, the `blockCommentId` attribute is now recognized as valid
4. **Global Availability**: Unlike block supports, this approach ensures the attribute is available immediately when blocks are registered

## Key Differences from Block Support Approach

| Aspect | Block Support | Global Attribute |
|--------|---------------|------------------|
| **Timing** | Registered after blocks | Registered during block registration |
| **Availability** | Only for blocks that opt-in | Available for all blocks |
| **REST API** | May have timing issues | Always available |
| **Complexity** | More complex | Simpler implementation |

## Benefits

1. **Resolves 400 Error**: Fixes the REST API error when adding comments to `ServerSideRender` blocks
2. **Global Availability**: Ensures `blockCommentId` is available for all blocks
3. **Timing Safe**: Works regardless of when blocks are registered or REST API requests are made
4. **Follows WordPress Patterns**: Uses the same approach as `metadata` and `lock` attributes
5. **Backward Compatible**: Doesn't break existing functionality
6. **Simple Implementation**: Cleaner and more straightforward than block supports

## Usage

No additional configuration is needed. The `blockCommentId` attribute is automatically available for all blocks, similar to how `metadata` and `lock` attributes work.

## Testing

To test this implementation:

1. Create a block with `ServerSideRender` component
2. Add a block comment to the block
3. Verify that no 400 error occurs
4. Confirm that the `blockCommentId` attribute is properly handled

## Related Files

- `lib/block-supports/block-comment.php` - PHP global attribute implementation
- `packages/block-editor/src/hooks/block-comment.js` - JavaScript global attribute hook
- `lib/load.php` - PHP loading integration
- `packages/block-editor/src/hooks/index.js` - JavaScript loading integration

## References

- [GitHub Issue #71784](https://github.com/WordPress/gutenberg/issues/71784)
- [WordPress Global Attributes](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/class-wp-block-type.php#L282-L285)
- [Gutenberg Block Registration](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-editor/src/hooks)
