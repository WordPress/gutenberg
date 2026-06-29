---
number: 9017
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/9017
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Bug","[Package] Components"]
---

# Issue #9017: Components package: deprecated lifecycle method warning in slot-fill

- URL: https://github.com/WordPress/gutenberg/issues/9017
- Author: vindl
- Created: 2018-08-15T13:57:48Z
- Updated: 2019-05-28T19:35:47Z
- Comments: 3 of 3

## Body

The components package is using the deprecated `componentWillUpdate` lifecycle method which produces console warnings when executed in React strict mode.

https://github.com/WordPress/gutenberg/blob/6928e41c8afd7daa3a709afdda7eee48218473b7/packages/components/src/slot-fill/fill.js#L25-L34


```
Warning: Unsafe lifecycle methods were found within a strict-mode tree:
    in Editor (created by _class)
    in _class (created by RemountOnPropChange(_class))
    in RemountOnPropChange(_class)
    ...

componentWillUpdate: Please update the following components to use componentDidUpdate instead: Fill
```

cc @youknowriad @gziolo

## Issue comments

### youknowriad on 2018-08-15T13:59:22Z

URL: https://github.com/WordPress/gutenberg/issues/9017#issuecomment-413206019

This one is probably not the easiest one to replace because I believe the "order" of which the fills get added is important. So I'm pinging @aduth he knows more about that.

### aduth on 2018-08-15T14:56:26Z

URL: https://github.com/WordPress/gutenberg/issues/9017#issuecomment-413224058

Order is important, yes. I'll give it a look, and if there aren't tests already, will add them in the fix.

### aduth on 2019-05-28T19:35:46Z

URL: https://github.com/WordPress/gutenberg/issues/9017#issuecomment-496657877

As I understand, this was fixed as of #15541.

