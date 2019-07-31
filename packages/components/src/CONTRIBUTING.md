# Contributing components

These guidelines document how to contribute to components in the [`@wordpress/components`](https://www.npmjs.com/package/@wordpress/components) npm package, or “WordPress Components”. This can be addition, modification, or deprecation.

## Does it belong in the component library?

A component library should include what’s shared across many products and omit what’s not. Questions to help determine if a component should be added:

- Is it relevant to other products/plugins?
- Is there overlap with any existing components?
- How much will it cost to make and maintain?
- Can you articulate how the component should be used?

Here’s a flowchart that can help determine if a new component is necessary:

[![New component flowchart](https://wordpress.org/gutenberg/files/2019/07/New_component_flowchart.png)](https://coggle.it/diagram/WtUSrld3uAYZHsn-/t/new-ui-component/992b38cbe685d897b4aec6d0dd93cc4b47c06e0d4484eeb0d7d9a47fb2c48d94)

## First steps to contributing

Once you’re ready to contribute to WordPress Components, start by opening a GitHub issue. Include a detailed description in which you:

- Explain the rationale
- Detail the intended behavior
- Clarify whether it’s a variation of an existing component, or a new asset
- Include mockups of any fidelity (optional)
- Include any inspirations from other products (optional)

This issue will be the staging ground for the contribution and an opportunity for the community to weigh in with any suggestions. Reviewers can also check if there is overlap with an existing component, or if there is a more appropriate location for the component.
It’s encouraged to surface works-in-progress. If you’re not able to complete all of the parts yourself, someone in the community may be able to pick up where you left off.

## Parts of a component contribution

1. **Provide a rationale**: Explain how your component will add value to the system and the greater product ecosystem. Be sure to include any user experience and interaction descriptions.
2. **Create a design spec**: Create sizing and styling annotations for all aspects of the component. This spec should provide a developer with everything they need to create the design in code.
3. **Create a Figma component**: Any new components or changes to existing components will mirror the [WordPress Components Figma library](https://www.figma.com/file/ZtN5xslEVYgzU7Dd5CxgGZwq/WordPress-Components?node-id=735%3A0), so we’ll need to update the Figma library and publish the changes. Please follow the [guidelines](https://www.figma.com/file/ZtN5xslEVYgzU7Dd5CxgGZwq/WordPress-Components?node-id=746%3A38) for contributing to the Figma libraries.
4. **Provide usage documentation**: If the contribution adds additional behavior or expands a component’s features, we’ll need to document them with development and design guidelines. Read through existing component documentation for examples.
5. **Provide working code**: The component or enhancement must be built in React. See the [developer contribution guidelines](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/develop.md).

Remember, it’s unlikely that all parts will be done by one person. Someone in the community may be able to help.

## Component refinement

Before a component is published it will need to be fine-tuned:

1. **Expand** to a minimally sufficient feature set. Resolve what features should be included in the component.
2. **Reduce** scope to omit contentious features. Review proposed features and prune unessential items lacking consensus.
3. **Quality assurance**: each contribution must be normalized into system standards.

### Quality assurance

To ensure quality, each component should be tested. The testing process should be done during the development of the component and before the component is published. 

- **Accessibility**: Has the design and implementation accounted for accessibility? Please use the [WordPress accessibility guidelines](https://make.wordpress.org/accessibility/handbook/best-practices/).
- **Visual quality**: Does the component apply visual style — color, typography, icons, space, borders, and more — using appropriate variables, and does it follow [visual guidelines](https://make.wordpress.org/design/handbook/design-guide/)?
- **Responsiveness**: Does it incorporate responsive display patterns and behaviors as needed? Is the component designed from a mobile-first perspective? Do all touch interactions work as expected?
- **Sufficient states & variations**: Does it cover all the necessary variations (primary, secondary, dense, etc.) and states (default, hover, active, disabled, loading, etc.), given the intended scope?
- **Content resilience**: Is each dynamic word or image element resilient to too much, too little, and no content at all, respectively? How long can labels be, and what happens when you run out of space?
- **Composability**: Does it fit well when placed next to or layered with other components to form a larger composition?
- **Functionality**: Do all behaviors function as expected?
- **Browser support**: Has the component visual quality and accuracy been assessed across Safari, Chrome, Firefox, IE, and other browsers across relevant devices? Please adhere to our [browser support requirements](https://github.com/WordPress/gutenberg/blob/master/packages/browserslist-config/index.js).
- **Documentation**: Ensure that the component has proper documentation for development, design, and accessibility.

## Deprecation

A component/feature may need deprecation if:

- There’s a preferred alternative or it’s no longer in demand
- It’s no longer necessary 
- It’s moved to a different location

At no point does the deprecated component become unavailable. Instead, the commitment to support it stops. The following steps are needed to deprecate a component:

1. Communicate intent via regular channels.
    1. Describe reasoning for deprecation.
    2. Decide on a timeline.
2. Ensure backwards compatibility to keep it available.
3. Clearly mark the component as deprecated in documentation and other channels.



