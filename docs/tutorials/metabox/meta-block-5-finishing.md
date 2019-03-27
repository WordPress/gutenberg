# Finishing Touches

One problem using a meta block is the block is easy for an author to forget, since it requires being added to each post. You solve this by using [block templates](/docs/designers-developers/developers/block-api/block-templates.md). A block template is a predefined list of block items per post type. Templates allow you to specify a default initial state for a post type.

For this example, you use a template to automatically insert the meta block at the top of a post.

Add the following code to the `myguten-meta-block.php` file:

```php
function myguten_register_template() {
    $post_type_object = get_post_type_object( 'post' );
    $post_type_object->template = array(
        array( 'myguten/meta-block' ),
    );
}
add_action( 'init', 'myguten_register_template' );
```

You can also add other block types in the array, including placeholders, or even lock down a post to a set of specific blocks. Templates are a powerful tool for controlling the editing experience, see the documentation linked above for more.

