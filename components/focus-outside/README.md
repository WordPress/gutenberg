Focus Outside
=============

`<FocusOutside />` is a convenience component for the [`withFocusOutside` higher-order component](../higher-order/with-focus-outside/). Since `withFocusOutside` applies its own wrapper component to intercept focus events, it can occasionally conflict where a DOM parent-child relationship is expected (e.g. CSS styling).

Eventually, this component may become unnecessary, if React natively supports event capture on `Fragment` elements.

See: https://github.com/facebook/react/issues/12051
