## Unreleased (2.0.0)

- Breaking: Add new API methods `toHaveInformed`, `toHaveInformedWith`, `toHaveLogged` and `toHaveLoggedWith` ([137](https://github.com/WordPress/packages/pull/137)). If the code under test calls `console.log` or `console.info` it will fail, unless one of the newly introduced methods is explicitly used to verify it.

## 1.0.7 (2018-05-18)

- Fix: Standardized `package.json` format  ([#119](https://github.com/WordPress/packages/pull/119))

## 1.0.6 (2018-02-28)

- Removed `package-lock.json` file, lockfiles for apps, not packages ([#88](https://github.com/WordPress/packages/pull/88))
