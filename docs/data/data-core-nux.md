# **core/nux**: The NUX (New User Experience) Data

## Selectors

### getAssociatedGuide

Returns an object describing the guide, if any, that the given tip is a part
of.

*Parameters*

 * state: Global application state.
 * tipId: The tip to query.

### isTipVisible

Determines whether or not the given tip is showing. Tips are hidden if they
are disabled, have been dismissed, or are not the current tip in any
guide that they have been added to.

*Parameters*

 * state: Global application state.
 * tipId: The tip to query.

*Returns*

Whether or not the given tip is showing.

### areTipsEnabled

Returns whether or not tips are globally enabled.

*Parameters*

 * state: Global application state.

*Returns*

Whether tips are globally enabled.

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

### enableTips

Returns an action object that, when dispatched, makes all tips show again.