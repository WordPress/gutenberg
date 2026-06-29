---
number: 8138
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8138
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Question","[Feature] Blocks","[Package] Components"]
---

# Issue #8138: Select control: null value to empty string

- URL: https://github.com/WordPress/gutenberg/issues/8138
- Author: iamzozo
- Created: 2018-07-23T12:25:28Z
- Updated: 2019-05-27T00:57:41Z
- Comments: 1 of 1

## Body

Here the select control simply gets the option value:
https://github.com/WordPress/gutenberg/blob/master/packages/components/src/select-control/index.js#L53

However, when using attributes with a null default value, the option value gets the label itself.
What do you think to check against null and use empty as default? Or just use empty strings for default?

`{ option.value || '' }`

Here is the example:
```
const options = [ { label: __( 'All' ), value: null }, ...categories ]
```
```
<select name="category">
    <option value>All</option>
    <option value="1">First category</option>
    <option value="2">Second category</option>
</select>
```

Here the value will be **All** by default, and ServerSideRenderer will send `All` as value.

## Issue comments

### nerrad on 2019-05-27T00:57:20Z

URL: https://github.com/WordPress/gutenberg/issues/8138#issuecomment-496046299

Hey there, sorry for the long time before getting a reply to your issue!

I think semantically, we want to keep current behaviour so that the provided value is explicitly used. I'm not sure that the expectation you gave for your example is correct (unless I'm reading things wrong).  If you have `<option value>All</option`, then the value received on a post is an empty string for the "All" option.  The only time "All" would get returned is if you had something like this `<option>All</option>`

If there are any additional reasons to add why this is a necessary enhancement to make feel free to add them to this issue but for now I'm going to close it.

