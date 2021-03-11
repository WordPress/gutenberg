Hook providing with refs to bind two elements.

One ref is used to set 'isEdit' state to true upon clicking. The second is used to set 'isEdit' state to false on 'Enter'/onBlur event and triggering onCommit callback with its value.

The hook was designed to be a component in the first place, but a hook gives more flexibility.
