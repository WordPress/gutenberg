# Propagating updates 

This resource seeks to offer direction for those needing to provide updates to content, whether in a template for a theme, pattern, or a block over an entire site. Since each content type allows or disallows certain kind of synchronization, it's important to know what's possible before creating to make maintenance easier in the future. 

## How to approach managing updates

**Establish early what content you expect to require updates**

At a high level, it’s important to recognize that not every piece of content can be updated across the entire site and that the method of creation greatly impacts what’s possible. As a result, it’s critical to spend time ahead of creation determining what you expect to need updates and to put that content in the appropriate format. This will make a huge difference in terms of future maintenance. 

**Embrace theme design at the block level**

Block theme design requires a mindset shift from the previous approach of designing large sections of a theme and controlling them via updates. While a holistic view of a design is still important when creating a custom theme project, blocks require that themers approach design on a more atomic level. This means starting from the block itself, typically through theme.json customizations. The goal is that each individual "atom" (i.e., block) can be moved around, edited, deleted, and put back together without the entire design falling apart.

The more that you approach design at the block level, the less need there is to propagate updates to things like patterns and templates across the entire site. If the atomic pieces are in place, their layout should not matter.

## Overview of content types

**Blocks**

Dynamic blocks with the Save() method defining a default output is the recommended approach for blocks that you expect to change over time. The updates on any block will be automatically applied as the main HTML output will be always generated on render time by PHP code of the block. To get started on creating blocks and save time, [you can use the Create Block tool](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/).

Generally speaking, this is the preferred approach due to the overhead involved with managing [block deprecations](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/) and the requirement to manually update existing blocks otherwise. Keep in mind that the biggest downside with dynamic blocks comes from needing to manage markup in two places. Depending on your needs and comfortability, either approach can work and it ultimately depends on the nature of the block itself. 

**Patterns**

For content that you want updated later on, do not use patterns and instead rely on reusable blocks or template parts. Patterns cannot be updated after you insert one into your site. For context, you can think of Patterns as more like sample/example/starter content. While Patterns exposed in the Inserter might evolve over time, those changes won't be automatically applied to any current useage of the pattern. Once insertered, patterns become completely detached from the original pattern unlike Reusable block or Template Part block. 

If needed, one potential workaround for patterns with custom styles is to add a class name to the wrapping block for a pattern. For example, the following adds a themeslug-special class to a Group block:

```
<!-- wp:group {"className":"themeslug-special"} -->
<div class="wp-block-group themeslug-special">
	<!-- Nested pattern blocks -->
</div>
<!-- /wp:group -->
```

It is not fool-proof because users can modify the class via the editor UI.  However, because this setting is under the "Advanced" panel it is likely to stay intact in most instances. This gives theme authors some CSS control for some pattern types, allowing them to update existing uses. However, it does not prevent users from making massive alterations that cannot be updated. 

**Reusable blocks**

As the name suggests, these blocks are inherently synced across your site. Keep in mind that there are currently limitations with relying on reusable blocks to handle certain updates since content, HTML structure, and styles will all stay in sync when updates happen. If you require more nuance than that, this is a key element to factor in and a dynamic block might be a better approach.

**Template Parts and Templates**

Because block themes allow users to directly edit templates and template parts, how changes are managed need to be adjusted in light of the greater access given to users. For context, when templates or template parts are changed by the user, the updated templates from the theme update don’t show for the user. Only new users of the theme or users who have not yet edited a template are experiencing the updated template. If users haven’t modified the files then the changes you make on the file system will be reflected on the user’s sites – you just need to update the files and they’ll get the changes. However if they have made changes to their templates then the only way you can update their templates is to:

- Revert all their changes
- Update the templates and template parts in the database

Generally speaking, if a user has made changes to templates then it’s recommended to leave the templates as is, unless agreed upon with the user (ie in an agency setting). 

One thing to be mindful of when updating templates is inserting references to new or different template parts.  For example, the templates/page.html template could insert a parts/header.html part in version 1.0 but change that reference to parts/header-alt.html in version 2.0.  Some developers may see this as a "workaround" in instances where users modified the original header.html.  However, this is likely to break a user's customized design since the page.html template would no longer reference the correct part unless they also modified and saved the page template.

Likewise, it is generally poor practice to delete template parts in theme updates.  In this scenario, users could create custom top-level templates that include a call to the part and expect it to continue existing.

**Resources**

- [Comparing Patterns, Template Parts, and Reusable Blocks](https://wordpress.org/support/article/comparing-patterns-template-parts-and-reusable-blocks/)
- [Block deprecation](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/)
- [Create Block tool](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/)


