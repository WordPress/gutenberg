# Testing published packages across WordPress versions

A plugin or application can include a published package in its JavaScript bundle while loading that package's dependencies from WordPress. These parts update separately. Testing only the current Gutenberg source does not cover every combination that can run in production.

Use this guide before changing an API, dependency, package entrypoint, runtime registration, allowlist, opt-in gate, or compatibility fallback in this setup.

## Identify what ships where

Start with every package entrypoint and build output affected by the change. An entrypoint is an import path with its own build, such as a package's main import or a `/wp` import.

Check package metadata, build configuration, dependency extraction, and generated asset data. Record:

-   Which packages the application includes in its bundle.
-   Which dependencies WordPress supplies at runtime.
-   Which WordPress versions the application supports.
-   Which older bundle versions are still used by maintained applications and plugins.

Do not infer this from a package name or current source imports. Publishing a new package does not update bundles that are already deployed.

Some package state must come from the same package copy. React contexts, private API locks, registries, and symbols are examples. If two package copies create separate React contexts, a provider from one copy cannot supply a value to a consumer using the other. The exports can look identical while the copies remain incompatible.

## Test public API changes with existing consumers

If a public API changes, test representative existing consumer code against the candidate package. Compile the published types, build the consumer, and exercise the changed behaviour.

Updating repository call sites proves that the new API works. It does not prove that existing consumers still work or have a migration path.

If the package and its dependency always ship in the same file or application bundle, there is no cross-version combination to test. The existing-consumer test still applies to public API changes.

## Test both mixed-version combinations

When WordPress supplies a dependency separately from the bundle, test these combinations:

| Bundled package | WordPress-supplied dependency | Expected result                                                                                                          |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Old             | Old                           | Preserve the existing behaviour.                                                                                         |
| Old             | New                           | The new dependency preserves the API, behaviour, and shared state used by the old bundle.                                |
| New             | Old                           | The new bundle works on each supported WordPress version, or the change raises the minimum supported version explicitly. |
| New             | New                           | The new API and behaviour work together.                                                                                 |

Start with the last package release before the change. Include earlier releases when the application's support policy or maintained consumers still use them. For versions outside that boundary, document the break and the package version or entrypoint consumers must use instead.

Build the candidate package before testing it. Unbuilt source is not the code that consumers install.

For each supported combination and entrypoint:

1. Install the exact package versions in an isolated consumer.
2. Compile against their published TypeScript declarations.
3. Build with the consumer's real dependency extraction configuration.
4. Check the exports and module-load conditions in the supported WordPress version.
5. Check shared state such as React contexts when separate package copies are possible.
6. Exercise the affected behaviour, including any fallback.

Mark each check as `pass`, `fail`, or `unverified`. Current source usually proves only the new bundle with the new dependency. A mock can test which fallback branch runs. It cannot reproduce dependency extraction, separate package copies, or an older WordPress runtime.

## Coordinate changes across releases

Sometimes both mixed-version combinations need support during a migration. If the old and new APIs can coexist:

1. Add the new API to the WordPress-supplied dependency and keep the existing API while older supported bundles still need it.
2. Make the new bundle prefer the new API and fall back when an older WordPress version does not provide it.
3. Prevent new direct use of the old API outside the fallback.
4. Publish both packages through the required npm and WordPress release channels before removing either compatibility path.

Check actual exports instead of comparing version strings. Keep the fallback in one place in the bundled package.

Remove a private compatibility API and the new bundle's fallback as separate release changes. Before each removal, repeat the consumer and release checks. A scheduled removal version is a review point, not proof that affected bundles have updated. Production public APIs follow the [backward compatibility policy](/docs/contributors/code/backward-compatibility.md).

New bundled packages must not use private APIs. Repository lint and bundle checks enforce this for new direct and transitive use, but they cannot change older bundles that are already deployed.

Private APIs remain private and can be removed. A temporary compatibility export does not make a private API public. Keep it only while a supported older bundle needs it. Then remove it after the replacement has shipped and the required combinations pass, or make the support change explicit.

Some compatibility problems cannot use a fallback. Private API locks and React contexts depend on package identity. If separate package copies create different identities, use an API that does not depend on that shared identity, change the supported entrypoint, or change the supported WordPress version.

<details>
<summary>Why this guide exists</summary>

The `ThemeProvider` change in [#78958](https://github.com/WordPress/gutenberg/pull/78958) made the API public and removed its private path in the same release. Published bundles broke, so [#79594](https://github.com/WordPress/gutenberg/pull/79594) restored the private path. [#79620](https://github.com/WordPress/gutenberg/pull/79620) then kept both paths while consumers migrated.

The [DataViews cleanup discussion in #81230](https://github.com/WordPress/gutenberg/issues/81230#issuecomment-5358110498) found the reverse problem. An older bundled `@wordpress/dataviews` package could still request a private `@wordpress/components` API after a newer WordPress runtime removed it. [#82221](https://github.com/WordPress/gutenberg/pull/82221) restored the DataViews opt-in for those older bundles. A bundled `@wordpress/private-apis` copy still cannot unlock an object created by a different runtime copy.

</details>
