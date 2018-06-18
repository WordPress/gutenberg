withBindAttribute
=================

Higher-order component which augments a base component that is expected to
receive `value` and `onChange` props, augmenting the component to receive a
`bindAttribute` component where a string is passed to automatically handle
changes as setting attributes for the current block context.

## Example

```jsx
import { withBindAttribute } from '@wordpress/editor';

const MyInput = ( { value, onChange } ) => <input value={ value } onChange={ onChange } />;
const MyEnhancedInput = withBindAttribute( MyInput );

// Usage:
//
//  <MyEnhancedInput bindAttribute="content" />
```
