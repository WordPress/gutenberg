# Avoid unjustified disabling of ESLint rules (no-unjustified-disable)

If a developer finds themself in the position to disable an ESLint rule, one of the following should hold true:

- They can provide a reason the rule is not applicable or remediation steps are provided.
- The rule does not provide value for the development team.

By providing justification for the disabling of a rule, a developer communicates intent to future maintainers who may otherwise not understand the reasons it was done. Such uncertainty can needlessly discourage refactoring or unnecessarily perpetuate the configuration. Good justification can serve as a description for the conditions of its own removal.

If a rule is not valuable, it should not be part of the development team's default configuration.

## Rule details

Examples of **incorrect** code for this rule:

```js
// eslint-disable-next-line
var f = foo();
```

Examples of **correct** code for this rule:

```js
// Disable reason: The rule is not applicable because remediation steps X, Y,
// and Z have accounted for the problems otherwise anticipated.

// eslint-disable-next-line
var f = foo();
```
