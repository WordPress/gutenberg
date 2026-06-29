---
number: 8426
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8426
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Enhancement","[Feature] UI Components","[Package] Components"]
---

# Issue #8426: SelectControl don't support options attributes and optgroups

- URL: https://github.com/WordPress/gutenberg/issues/8426
- Author: unknown
- Created: 2018-08-03T08:56:03Z
- Updated: 2021-01-21T05:09:08Z
- Comments: 4 of 4

## Body

**Describe the bug**
[SelectControl](https://github.com/WordPress/gutenberg/tree/master/packages/components/src/select-control) lack support for options attributes ( disabled namely ) and there is no support for optgroup.

**Expected behavior**
Ability to pass into component options disabled attribute and be able to add options in optgroups.

**Additional context**
- You can read about option tag here: https://www.w3schools.com/tags/tag_option.asp
- Here is a link for optgroup tag: https://www.w3schools.com/tags/tag_optgroup.asp

Terrible job so far, keep it up! And for love of god start working on proper documentation for this monster.

## Issue comments

### paaljoachim on 2021-01-13T01:24:18Z

URL: https://github.com/WordPress/gutenberg/issues/8426#issuecomment-759141749

Is this issue still relevant?
If so how can we move in onward?

### Ugoku on 2021-01-18T11:06:17Z

URL: https://github.com/WordPress/gutenberg/issues/8426#issuecomment-762175385

Yes, this is still relevant! Please see https://github.com/WordPress/gutenberg/issues/17032 as well

### paaljoachim on 2021-01-18T11:24:39Z

URL: https://github.com/WordPress/gutenberg/issues/8426#issuecomment-762185712

Thank you for the feedback!

Pinging:
@WordPress/gutenberg-core

### tellthemachines on 2021-01-21T05:09:08Z

URL: https://github.com/WordPress/gutenberg/issues/8426#issuecomment-764342808

It's already possible to add attributes such as `disabled` to the underlying `select` element in `SelectControl`. See [this section](https://github.com/WordPress/gutenberg/blob/master/packages/components/src/select-control/README.md#L124) of the readme for details.

As the only remaining item to address is optgroups, I'm closing this issue in favour of #17032.

