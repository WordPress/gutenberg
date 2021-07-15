# Contributing components

You can contribute by adding, modifying, or deprecating components, as well as helping with design, development, and documentation.

## Does it belong in the component library?

A component library should include components that are generic and flexible enough to work across a variety of products. It should include what’s shared across many products and omit what’s not.

To determine if a component should be added, ask yourself:

-   Could this component be used by other products/plugins?
-   Does the new component overlap (in functionality or visual design) with any existing components?
-   How much effort will be required to make and maintain?
-   Is there a clear purpose for the component?

Here’s a flowchart that can help determine if a new component is necessary:

[![New component flowchart](https://wordpress.org/gutenberg/files/2019/07/New_component_flowchart.png)](https://coggle.it/diagram/WtUSrld3uAYZHsn-/t/new-ui-component/992b38cbe685d897b4aec6d0dd93cc4b47c06e0d4484eeb0d7d9a47fb2c48d94)

## First steps

If you have a component you'd like added or changed, start by opening a GitHub issue. Include a detailed description in which you:

-   Explain the rationale
-   Detail the intended behavior
-   Clarify whether it’s a variation of an existing component, or a new asset
-   Include mockups of any fidelity (optional)
-   Include any inspirations from other products (optional)

This issue will be used to discuss the proposed changes and track progress. Reviewers start by discussing the proposal to determine if it's appropriate for WordPress Components, or if there's overlap with an existing component.

It’s encouraged to surface works-in-progress. If you’re not able to complete all of the parts yourself, someone in the community may be able to pick up where you left off.

## Next steps

Once the team has discussed and approved the change, it's time to start implementing it.

1. **Provide a rationale**: Explain how your component will add value to the system and the greater product ecosystem. Be sure to include any user experience and interaction descriptions.
2. **Draft documentation**: New components need development, design, and accessibility guidelines. Additionally, if your change adds additional behavior or expands a component’s features, those changes will need to be fully documented as well. Read through existing component documentation for examples. Start with a rough draft, and reviewers will help polish documentation.
3. **Provide working code**: The component or enhancement must be built in React. See the [developer contribution guidelines](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/README.md).
4. **Create a design spec**: Create sizing and styling annotations for all aspects of the component. This spec should provide a developer with everything they need to create the design in code. [Figma automatically does this for you](https://help.figma.com/article/32-developer-handoff).
5. **Create a Figma component**: Any new components or changes to existing components will be mirrored in the [WordPress Components Figma library](https://www.figma.com/file/ZtN5xslEVYgzU7Dd5CxgGZwq/WordPress-Components?node-id=735%3A0), so we’ll need to update the Figma library and publish the changes. Please follow the [guidelines](https://www.figma.com/file/ZtN5xslEVYgzU7Dd5CxgGZwq/WordPress-Components?node-id=746%3A38) for contributing to the Figma libraries.

Remember, it’s unlikely that all parts will be done by one person. Contribute where you can, and others will help.

## Component refinement

Before a component is published it will need to be fine-tuned:

1. **Expand** the features of the component to a minimum. Agree on what features should be included.
2. **Reduce** scope and leave off features lacking consensus.
3. **Quality assurance**: each contribution must adhere to system standards.

### Quality assurance

To ensure quality, each component should be tested. The testing process should be done during the development of the component and before the component is published.

-   **Accessibility**: Has the design and implementation accounted for accessibility? Please use the [WordPress accessibility guidelines](https://make.wordpress.org/accessibility/handbook/best-practices/). You must use the "Needs Accessibility Feedback" label and get a review from the accessibility team. It's best to request a review early (at the documentation stage) in order to ensure the component is designed inclusively from the outset.
-   **Visual quality**: Does the component apply visual style — color, typography, icons, space, borders, and more — using appropriate variables, and does it follow [visual guidelines](https://make.wordpress.org/design/handbook/design-guide/)? You must use the "Needs Design Feedback" label and get a review from the design team.
-   **Documentation**: Ensure that the component has proper documentation for development, design, and accessibility.
-   **Sufficient states & variations**: Does it cover all the necessary variations (primary, secondary, dense, etc.) and states (default, hover, active, disabled, loading, etc.), within the intended scope?
-   **Functionality**: Do all behaviors function as expected?
-   **Responsiveness**: Does it incorporate responsive behaviors as needed? Is the component designed from a mobile-first perspective? Do all touch interactions work as expected?
-   **Content resilience**: Is each dynamic word or image element resilient to too much, too little, and no content at all, respectively? How long can labels be, and what happens when you run out of space?
-   **Composability**: Does it fit well when placed next to or layered with other components to form a larger composition?
-   **Browser support**: Has the component visual quality and accuracy been checked across Safari, Chrome, Firefox, IE, etc? Please adhere to our [browser support requirements](https://github.com/WordPress/gutenberg/blob/HEAD/packages/browserslist-config/index.js).

## Deprecation

A component or prop may need deprecation if it's renamed or removed.

At no point does the deprecated component/prop become unavailable. Instead, the commitment to support it stops. The following steps are needed to deprecate a component:

1. Communicate intent via regular channels.
    1. Describe reasoning for deprecation.
    2. Decide on a timeline.
2. Ensure backwards compatibility to keep it available.
3. Clearly mark the component as deprecated in documentation and other channels.
