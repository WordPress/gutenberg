# Animation

Animation can help reinforce a sense of hierarchy and spatial orientation. This document goes into principles you should follow when you add animation.

## Principles

### Point of Origin

- Animation can help anchor an interface element. For example a menu can scale up from the button that opened it.
- Animation can help give a sense of place; for example a sidebar can animate in from the side, implying it was always hidden off-screen.
- Design your animations as if you're working with real-world materials. Imagine your user interface elements are made of real materials — when not on screen, where are they? Use animation to help express that.

### Speed

- Animations should never block a user interaction. They should be fast, almost always complete in less than 0.2 seconds.
- A user should not have to wait for an animation to finish before they can interact.
- Animations should be performant. Use `transform` CSS properties when you can, these render elements on the GPU, making them smooth. 
- If an animation can't be made fast & performant, leave it out.

### Simple

- Don't bounce if the material isn't made of rubber.
- Don't rotate, fold, or animate on a curve. Keep it simple.

### Consistency

In creating consistent animations, we have to establish physical rules for how elements behave when animated. When all animations follow these rules, they feel consistent, related, and predictable. An animation should match user expectations, if it doesn't, it's probably not the right animation for the job.

Reuse animations if one already exists for your task. 

## Inventory of Reused Animations

The following is a running list of existing animations, and how they fit with the above principles. 

### `edit-post__loading-fade-animation`

A "pulsing fade" animation that is used when an element is _transient_. For example when an image is being uploaded. It is simple, and indicates background work.

### `edit-post__fade-in-animation`

The most basic fade-in animation. It simply fades from transparent to opaque.

### `components-button__busy-animation`

When a button is working, this animation adds a set of diagonal stripes that animate from left to right. 

### `components-modal__appear-animation`

Modal windows are cards that live below the viewport. When invoked, they animate in front of the button and upwards. Because of their relative size, this is a very brief fade animation. 

### `components-spinner__animation`

A simple rotation used for a loading-state spinner.

### `edit-post-fullscreen-mode__slide-in-animation`

When you enter fullscreen mode, the editor bar animates downwards from the top.

### `edit-post-layout__slide-in-animation`

The Publish sidebar lives to the right of the viewport. When you press the "Publish..." button, it slides in from the right.

### `nux-pulse`

This animation is used for the dot indicators that appear in the out of box experience. They create a "pulsing" effect behind the dot indicators.
