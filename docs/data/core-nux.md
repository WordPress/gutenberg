# **core/nux**: The NUX module Data

## Selectors 

### isTipVisible

Determines whether or not the given tip is showing. Tips are hidden if they
are disabled, have been dismissed, or are not the current tip in any
guide that they have been added to.

*Parameters*

 * state: Global application state.
 * id: The tip to query.

## Actions

### triggerGuide

Returns an action object that, when dispatched, presents a guide that takes
the user through a series of tips step by step.

*Parameters*

 * tipIds: Which tips to show in the guide.

### dismissTip

Returns an action object that, when dispatched, dismisses the given tip. A
dismissed tip will not show again.

*Parameters*

 * id: The tip to dismiss.

### disableTips

Returns an action object that, when dispatched, prevents all tips from
showing again.