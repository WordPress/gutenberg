// Originally this pointed at a Reakit implementation of
// `Composite`, but we are removing Reakit entirely from the
// codebase. Until the new 'current' Ariakit implementation
// is unlocked and no longer private, we will continue to
// support the Reakit API through the 'legacy' version,
// which uses Ariakit under the hood.

export * from './legacy';
