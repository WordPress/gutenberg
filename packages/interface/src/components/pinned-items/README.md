# PinnedItems

There are situations where a screen has an area for favorites or pinned items.
This Component allows adding items to that area. Most of the time, the Component should not be used directly as, for example, `ComplementaryArea` Component already renders PinnedItems that allow opening complementary areas marked as favorite.
When used directly, items should not unconditionally add items should only be added if they are marked as "favorite" or verify other conditions.

## Props

### children

The content to be displayed for the pinned items. Most of the time, a button with an icon should be used.

-   Type: `Element`
-   Required: Yes

### scope

The scope of the pinned items area e.g: "core", "myplugin/custom-screen-a",

-   Type: `String`
-   Required: Yes

# PinnedItems.Slot

A slot that renders the pinned items.

## Props

### scope

The scope of the pinned items area e.g: "core", "myplugin/custom-screen-a",

-   Type: `String`
-   Required: Yes
