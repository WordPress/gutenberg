<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 7.10.0 (2024-10-16)

## 7.9.0 (2024-10-03)

## 7.8.0 (2024-09-19)

## 7.7.0 (2024-09-05)

## 7.6.0 (2024-08-21)

## 7.5.0 (2024-08-07)

## 7.4.0 (2024-07-24)

## 7.3.0 (2024-07-10)

## 7.2.0 (2024-06-26)

## 7.1.0 (2024-06-15)

## 7.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 6.26.0 (2024-05-16)

## 6.25.0 (2024-05-02)

## 6.24.0 (2024-04-19)

## 6.23.0 (2024-04-03)

## 6.22.0 (2024-03-21)

## 6.21.0 (2024-03-06)

## 6.20.0 (2024-02-21)

## 6.19.0 (2024-02-09)

## 6.18.0 (2024-01-24)

## 6.17.0 (2024-01-10)

## 6.16.0 (2023-12-13)

## 6.15.0 (2023-11-29)

## 6.14.0 (2023-11-16)

## 6.13.0 (2023-11-02)

## 6.12.0 (2023-10-18)

## 6.11.0 (2023-10-05)

## 6.10.0 (2023-09-20)

## 6.9.0 (2023-08-31)

## 6.8.0 (2023-08-16)

## 6.7.0 (2023-08-10)

## 6.6.0 (2023-07-20)

## 6.5.0 (2023-07-05)

## 6.4.0 (2023-06-23)

## 6.3.0 (2023-06-07)

## 6.2.0 (2023-05-24)

## 6.1.0 (2023-05-10)

## 6.0.0 (2023-04-26)

### Breaking Changes

-   Publish types for `@wordpress/plugins` ([#49649](https://github.com/WordPress/gutenberg/pull/49649))

## 5.8.0 (2023-04-12)

## 5.7.0 (2023-03-29)

## 5.6.0 (2023-03-15)

## 5.5.0 (2023-03-01)

## 5.4.0 (2023-02-15)

## 5.3.0 (2023-02-01)

## 5.2.0 (2023-01-11)

## 5.1.0 (2023-01-02)

## 5.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 4.20.0 (2022-11-16)

## 4.19.0 (2022-11-02)

## 4.18.0 (2022-10-19)

## 4.17.0 (2022-10-05)

## 4.16.0 (2022-09-21)

## 4.15.0 (2022-09-13)

## 4.14.0 (2022-08-24)

## 4.13.0 (2022-08-10)

## 4.12.0 (2022-07-27)

## 4.11.0 (2022-07-13)

## 4.10.0 (2022-06-29)

## 4.9.0 (2022-06-15)

## 4.8.0 (2022-06-01)

## 4.7.0 (2022-05-18)

## 4.6.0 (2022-05-04)

## 4.5.0 (2022-04-21)

## 4.4.0 (2022-04-08)

## 4.3.0 (2022-03-23)

## 4.2.0 (2022-03-11)

## 4.1.0 (2022-01-27)

## 4.0.0 (2021-07-29)

### Breaking Changes

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 3.2.0 (2021-07-21)

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.25.0 (2021-03-17)

### New Features

-   Add optional `settings.scope` field in the `registerPlugin` function ([#27438](https://github.com/WordPress/gutenberg/pull/27438)).
-   Add optional `scope` param in the `getPlugins` function([#27438](https://github.com/WordPress/gutenberg/pull/27438)).
-   Add optional `scope` prop in the `PluginArea` component ([#27438](https://github.com/WordPress/gutenberg/pull/27438)).

## 2.0.10 (2019-01-03)

## 2.0.9 (2018-11-15)

## 2.0.8 (2018-11-09)

## 2.0.7 (2018-11-09)

## 2.0.6 (2018-10-29)

## 2.0.5 (2018-10-20)

## 2.0.4 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Changes

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
