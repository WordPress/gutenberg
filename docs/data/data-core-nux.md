# **core/nux**: The NUX (New User Experience) Data

## Selectors 

### isTipVisible

Determines whether the given tip or DotTip instance should be visible. Checks:

- That all tips are enabled.
- That the given tip has not been dismissed.
- If the given tip is part of a guide, that the given tip is the current tip in the guide.
- If instanceId is provided, that this is the first DotTip instance for the given tip.

*Parameters*

 * state: Global application state.
 * tipId: The tip to query.
 * instanceId: A number which uniquely identifies the DotTip instance.

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

### registerTipInstance

Returns an action object that, when dispatched, associates an instance of the
DotTip component with a tip. This is usually done when the component mounts.
Tracking this lets us only show one DotTip at a time per tip.

*Parameters*

 * tipId: The tip to associate this instance with.
 * instanceId: A number which uniquely identifies the instance.

### unregisterTipInstance

Returns an action object that, when dispatched, removes the association
between a DotTip component instance and a tip. This is usually done when the
component unmounts. Tracking this lets us only show one DotTip at a time per
tip.

*Parameters*

 * tipId: The tip to disassociate this instance with.
 * instanceId: A number which uniquely identifies the instance.

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