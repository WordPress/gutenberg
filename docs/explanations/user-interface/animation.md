# Animation

Animation can help reinforce a sense of hierarchy and spatial orientation. This document goes into principles you should follow when you add animation.

## Principles

### Point of Origin

-   Animation can help anchor an interface element. For example a menu can scale up from the button that opened it.
-   Animation can help give a sense of place; for example a sidebar can animate in from the side, implying it was always hidden off-screen.
-   Design your animations as if you're working with real-world materials. Imagine your user interface elements are made of real materials — when not on screen, where are they? Use animation to help express that.

### Speed

-   Animations should never block a user interaction. They should be fast, almost always complete in less than 0.2 seconds.
-   A user should not have to wait for an animation to finish before they can interact.
-   Animations should be performant. Use `transform` CSS properties when you can, these render elements on the GPU, making them smooth.
-   If an animation can't be made fast & performant, leave it out.

### Simple

-   Don't bounce if the material isn't made of rubber.
-   Don't rotate, fold, or animate on a curved path. Keep it simple.

### Consistency

In creating consistent animations, we have to establish physical rules for how elements behave when animated. When all animations follow these rules, they feel consistent, related, and predictable. An animation should match user expectations, if it doesn't, it's probably not the right animation for the job.

Reuse animations if one already exists for your task.

## Accessibility Considerations

-   Animations should be subtle. Be cognizant of users with [vestibular disorders triggered by motion](https://www.ncbi.nlm.nih.gov/pubmed/29017000).
-   Don't animate elements that are currently reporting content to adaptive technology (e.g., an `aria-live` region that's receiving updates). This can cause confusion wherein the technology tries to parse a region that's actively changing.
-   Avoid animations that aren't directly triggered by user behaviors.
-   Whenever possible, ensure that animations respect the OS-level "Reduce Motion" settings. This can be done by utilizing the [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) media query. Gutenberg includes a `@reduce-motion` mixin for this, to be used alongside rules that include a CSS `animate` property.

## Inventory of Reused Animations

The generic `Animate` component is used to animate different parts of the interface. See [the component documentation](/packages/components/src/animate/README.md) for more details about the available animations.
