## 2.0.0 (Unreleased)

### Breaking Changes

- `CopyHandler` will now only catch cut/copy events coming from its `props.children`, instead of from anywhere in the `document`.

### Internal

- Improved handling of blocks state references for unchanging states.
- Updated handling of blocks state to effectively ignored programmatically-received blocks data (e.g. reusable blocks received from editor).

## 1.0.0 (2019-03-06)

### New Features

- Initial version.
