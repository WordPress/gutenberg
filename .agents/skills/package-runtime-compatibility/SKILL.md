---
name: package-runtime-compatibility
description: Use when planning, implementing, or reviewing a change to a published package that may break existing consumers, or where the package and independently supplied dependencies can run at different versions, including WordPress globals or script modules, alternate entrypoints, private-to-public migrations, dependency export changes, or duplicate singleton runtimes; do not use for internal changes with no public or cross-version compatibility risk or for consumer-only application work.
---

# Assess package and runtime compatibility

## Establish the deployment boundary

1. State the changed contract, the published package that consumes it, and
   every package or runtime that provides it.
2. Read the package guide's
   [cross-version compatibility procedure](../../../packages/README.md#maintaining-cross-version-compatibility).
3. Inspect every supported entrypoint and output. Record whether each affected
   dependency is bundled, externally supplied by WordPress, or can be deployed
   either way. Verify this from package metadata, build configuration,
   dependency extraction, and generated asset data rather than package names.
4. Identify dependencies that rely on shared identity, including private API
   locks, contexts, registries, symbols, and other singletons. Two runtime
   copies can be incompatible even when their exports have the same shape.

Name exact artifact and provider version pairs. Do not use "backward" or
"forward" alone when the direction could be ambiguous.

## Build the evidence matrix

For a change to the published package's own public surface, first run
representative existing consumer source against the candidate package. Verify
its types, bundle, and behaviour; migrating repository call sites is not a
substitute.

For each independently deployed bundle/provider boundary, use the package
guide's four old/new pairings. Assess each supported entrypoint separately and
record `pass`, `fail`, or `unverified` for:

-   dependency installation and resolution;
-   published exports and TypeScript declarations;
-   each supported bundled and externally resolved build;
-   actual WordPress runtime exports and shared identity; and
-   affected user-observable behaviour.

Do not create cross-version cells for a dependency that always ships in the
same artifact. Keep the direct public-consumer check when the package's own
contract changes.

Use exact published versions and candidate artifacts in isolated temporary
consumers. Current repository source proves only the new/new cell for its
current topology. Mocks prove a contract branch, but not dependency extraction,
duplicate package identity, or the runtime shipped by a supported WordPress
version.

## Choose a compatible transition

-   Prefer adding the replacement, migrating maintained consumers, and removing
    the old route only after every supported matrix cell is verified.
-   Bridge the end responsible for each supported skew direction. When both
    directions are supported and old and new routes can safely coexist, use a
    bidirectional overlap window:
    1. The provider exposes the new route and retains the old route as a
       deprecated bridge. This supports old bundles with the new provider.
    2. The new consumer prefers the new route and falls back to the old route by
       capability detection. This supports new bundles with the old provider.
    3. Both sides test their route, prevent new direct use of the deprecated
       route outside the centralized fallback, and publish before either bridge
       is removed.
-   Detect capabilities from the actual exports rather than version strings.
    Centralize the fallback or adapter in the consuming package.
-   Treat removal of the provider bridge and consumer fallback as separate
    release events. Remove each only after its supported pairings and release
    channels no longer need it.
-   Verify that the old route can cross the real deployment boundary. A bridge
    tied to package identity, such as a private API lock, can still fail across
    duplicate runtime copies even when the export remains present.
-   Do not treat a private or pre-1.0 label as proof that a removal is harmless.
    Assess published packages that carry or consume the dependency.
-   If compatibility requires dropping a supported version or entrypoint, make
    that an explicit product and release decision with migration guidance. Do
    not hide it inside an implementation change.

## Finish

Report each supported entrypoint's matrix, evidence for every cell, required
bridge or support change, release sequence, and any unverified runtime. A
destructive removal remains blocked while a required cross-version cell is
unverified.

When adding compatibility coverage, follow the
[testing skill](../testing/SKILL.md) and establish the unsupported pairing
before implementing its bridge or fallback.
