# Backward Compatibility

Gutenberg follows the WordPress backward compatibility principles. This means backward compatibility for production public API is guaranteed. In some rare occasions breaking backward compatibility is unavoidable, in that case, the breakage should be as small as possible and be documented as clearly as possible to third-party developers using dev notes.

## What qualifies as a production public API:

The Gutenberg code base is composed of two different types of packages: 
 - **production packages**: these are packages that are shipped as WordPress scripts (example: wp-components, wp-editor...).
 - **development packages**: these are made out of developer tools that can be used by third-party developers to lint, test, format and build their themes and plugins (example: @wordpress/scrips, @wordpress/env...). Typically, these are consumed as npm dependencies in third-party projects.

Backward compatibility guarantee only applies to the production packages as updates happen through WordPress upgrades.
 
Production packages use the `wp` global variable to provide APIs to third-party developers. These APIs can be JavaScript functions, variables and React components.

### How to guarantee backward compatibility for a JavaScript function

* The name of the function should not change.
* The order of the arguments of the function should not change.
* The function's returned value type should not change.
* Changes to arguments (new arguments, modification of semantics) is possible if we guarantee that all previous calls are still possible.

### How to guarantee backward compatibility for a React Component

* The name of the component should not change.
* The props of the components should not be removed.
* Existing prop values should continue to be supported. If a component accepts a function as prop, we can update the component to accept a new type for the same prop, but it shouldn't break existing usage.
* Adding new props is allowed.
* React Context dependencies can only be added or removed if we ensure the previous context contract is not breaking.
* Class names and DOM nodes used inside the tree of the component are not considered part of the public API and can be modified. That said, changes to these should be done with caution as it can affect the styling. Keep the old ones if possible. If not, document these changes and write a dev note about the changes.

### How to guarantee backward compatibility for a Block

* Existing usage of the block should not break or be marked as invalid when the editor is loaded.
* The styling of the existing blocks should be guaranteed.
* Markup changes should be limited to the minimum but If a block need to change its saved markup making previous versions invalid, a **deprecated version** for the block should be added.

## Deprecations

As the project evolves, flaws to existing APIs are discovered, or updates are required to support new features. When this happens, we try to guarantee that existing APIs don't break and build new alternative APIs.

To encourage third-party developers to adopt the new APIs instead, we can use the **deprecated** helper to show a message explaining the deprecation and proposing the alternative whenever the old API is used.

## Dev Notes

Dev notes are [posts published on the make/core site](https://make.wordpress.org/core/tag/dev-notes/) prior to WordPress releases to inform third-party developers about important changes to the developer APIs, these changes can include:
* Promote new APIs.
* Explain how some changes to existing APIs might affect existing plugins and themes (Example: classname changes...)
* When breaking backward compatibility is unavoidable, explain the reasons and the migration flow.
* When important deprecations are introduced (even without breakage), explain why and how third-party developpers can update their code base in consequence.

### Dev Note Workflow

- When working on Pull-request and the need for a dev-note is noted/discovered, add the **Needs Dev Note** label to the PR.
- If possible, add a comment to the PR explaining why the Dev Note is needed.
- When the first beta of the next WordPress release is shipped, go throught the list of merged PRs included in this release and tagged with the **Needs Dev Note** label.
- For each one of these PRs, write a Dev Note, coordinate with the WordPress release leads to publish the dev note.
- Once the dev note for a PR is published, remove the **Needs Dev Note** label from the PR.
