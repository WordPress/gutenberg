# Style runtime compatibility

-   Treat the shape of `globalThis.__wpStyleRuntime` as a backward-compatibility contract. Separately bundled versions of `@wordpress/style-runtime` can run on the same page and must be able to share that registry.
-   Keep consumers on the package's public APIs. Do not make application code read or write the reserved global directly.
