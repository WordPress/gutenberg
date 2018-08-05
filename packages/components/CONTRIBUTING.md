# Contributing

Thank you for taking the time to contribute.

The following is a set of guidelines for contributing to the `@wordpress/components` package to be considered in addition to the general ones described in our [Contributing Policy](../../CONTRIBUTING.md).

## Examples

Each component needs to include an example in its README.md file to demonstrate the usage of the component.

These examples can be consumed automatically from other projects in order to visualize them in their documentation. To ensure these examples are extractable, compilable and renderable, they should be structured in the following way:

* It has to be included in a `jsx` code block.
* It has to work out-of-the-box. No additional code should be needed to have working the example.
* It has to define a React component called `My<ComponentName>` which renders the example (i.e.: `MyButton`). Examples for the Higher Order Components should define a `MyComponent<ComponentName>` component (i.e.: `MyComponentWithNotices`). 
