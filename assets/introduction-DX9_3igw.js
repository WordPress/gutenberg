import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...i(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n,{title:`Design System/Introduction`}),`
`,(0,o.jsx)(t.h1,{id:`wordpress-design-system`,children:`WordPress Design System`}),`
`,(0,o.jsx)(t.p,{children:`The WordPress Design System is a collection of reusable components, design tokens, and guidelines for building consistent, accessible user interfaces in the WordPress administrative dashboard.`}),`
`,(0,o.jsx)(t.p,{children:`Rather than building UI elements from scratch each time, a design system provides pre-built, themeable components built on a foundation of design tokens. Design tokens encode design decisions like colors, spacing, and typography and can be customized to match different contexts while maintaining consistency.`}),`
`,(0,o.jsx)(t.h2,{id:`using-the-design-system`,children:`Using the Design System`}),`
`,(0,o.jsxs)(t.p,{children:[`Most often, you'll be interested in using components of the design system, like those provided through `,(0,o.jsxs)(t.a,{href:`https://github.com/WordPress/gutenberg/blob/trunk/packages/ui/README.md`,rel:`nofollow`,children:[`the `,(0,o.jsx)(t.code,{children:`@wordpress/ui`}),` package`]}),` and other packages described below in "Parts of the Design System".`]}),`
`,(0,o.jsxs)(t.p,{children:[`If you want to build your own components that inherit the same styles as the design system's own components, the `,(0,o.jsx)(t.a,{href:`/story/design-system-theme-introduction--docs`,children:`theming system`}),` provides a number of `,(0,o.jsx)(t.a,{href:`https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md`,rel:`nofollow`,children:`custom CSS properties`}),` that you can use in your own stylesheet.`]}),`
`,(0,o.jsxs)(t.p,{children:[`The `,(0,o.jsx)(t.a,{href:`?path=/docs/design-system-using-with-ai--docs`,children:`WordPress Design System MCP Server`}),` is recommended when working with AI agents for design or development in a project that uses the design system. It provides AI agents with component documentation, usage examples, and design tokens, so they correctly follow the latest design system guidance.`]}),`
`,(0,o.jsx)(t.h2,{id:`parts-of-the-design-system`,children:`Parts of the Design System`}),`
`,(0,o.jsx)(t.p,{children:`Describing the parts of a design system can be challenging, because ideally every part of the application inherits and builds from the design system fundamentals in some way.`}),`
`,(0,o.jsx)(t.p,{children:`In WordPress, when talking about the design system, we usually think of its scope including:`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Foundational packages`}),` establish the fundamental components and theming behaviors. As a low-level implementation, they are meant to be highly flexible, but this flexibility can make them difficult to work with.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Compositional packages`}),` operate at a higher-level, providing developer conveniences for composing the foundational elements of the design system into common solutions. These components optimize for predictable user experiences, sometimes intentionally limiting configurability in service of consistency.`]}),`
`]}),`
`,(0,o.jsx)(t.h3,{id:`foundational-packages`,children:`Foundational Packages`}),`
`,(0,o.jsx)(t.p,{children:`The WordPress Design System consists of a few core packages:`}),`
`,(0,o.jsxs)(t.h4,{id:`theming-wordpresstheme`,children:[`Theming (`,(0,o.jsx)(t.code,{children:`@wordpress/theme`}),`)`]}),`
`,(0,o.jsx)(t.p,{children:`The foundational layer that provides:`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Design Tokens`}),`: A comprehensive system of design tokens for colors, spacing, typography, shadows, and more.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Theme Provider`}),`: A component that accepts seed values and automatically generates consistent, accessible color ramps and spacing scales.`]}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[`Explore the `,(0,o.jsx)(t.a,{href:`/story/design-system-theme-introduction--docs`,children:`Theme documentation`}),` to learn more about design tokens, the token architecture, and how to use `,(0,o.jsx)(t.code,{children:`ThemeProvider`}),`.`]}),`
`,(0,o.jsxs)(t.h4,{id:`components-wordpressui`,children:[`Components (`,(0,o.jsx)(t.code,{children:`@wordpress/ui`}),`)`]}),`
`,(0,o.jsx)(t.p,{children:`A library of React UI components built on the theme foundation:`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Consistent patterns`}),`: All components follow a consistent set of technical design principles to ensure that their usage is easy to understand and predictable.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Token-driven styling`}),`: Components use design tokens for all visual properties, ensuring they automatically adapt to theme changes.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Accessible by default`}),`: Built with WordPress accessibility coding standards in mind, including semantic markup, keyboard navigation, and proper color contrast.`]}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[`Explore the `,(0,o.jsx)(t.a,{href:`/story/design-system-components-introduction--docs`,children:`Components documentation`}),` to learn more about the component library and usage patterns.`]}),`
`,(0,o.jsxs)(t.h4,{id:`icons-wordpressicons`,children:[`Icons (`,(0,o.jsx)(t.code,{children:`@wordpress/icons`}),`)`]}),`
`,(0,o.jsx)(t.p,{children:`A curated library of SVG icons for use throughout WordPress interfaces:`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Comprehensive coverage`}),`: A broad set of icons spanning common editor and admin actions.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Composable`}),`: Each icon is exported as a React component and can be rendered directly or through the `,(0,o.jsx)(t.code,{children:`<Icon>`}),` wrapper with adjustable size.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Consistent visual language`}),`: Drawn to a shared style so icons feel coherent wherever they appear across WordPress.`]}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[`See the `,(0,o.jsxs)(t.a,{href:`https://github.com/WordPress/gutenberg/tree/trunk/packages/icons`,rel:`nofollow`,children:[(0,o.jsx)(t.code,{children:`@wordpress/icons`}),` README`]}),` for usage details.`]}),`
`,(0,o.jsx)(t.h3,{id:`compositional-packages`,children:`Compositional Packages`}),`
`,(0,o.jsx)(t.p,{children:`Higher-level compositional packages use the design system to provide solutions for common UI patterns:`}),`
`,(0,o.jsxs)(t.h4,{id:`dataviews-wordpressdataviews`,children:[`DataViews (`,(0,o.jsx)(t.code,{children:`@wordpress/dataviews`}),`)`]}),`
`,(0,o.jsx)(t.p,{children:`A set of components and utilities for displaying, filtering, and editing lists of data:`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Multiple layouts`}),`: Render the same dataset as a table, grid, or list, with built-in search, filters, sorting, and pagination.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Selection and editing`}),`: `,(0,o.jsx)(t.code,{children:`DataViewsPicker`}),` optimizes the same experience for selecting items from a dataset, while `,(0,o.jsx)(t.code,{children:`DataForm`}),` handles creating and editing individual records.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Declarative fields`}),`: Drive rendering and behavior through field definitions rather than bespoke markup for each column or form.`]}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[`See the `,(0,o.jsxs)(t.a,{href:`https://github.com/WordPress/gutenberg/tree/trunk/packages/dataviews`,rel:`nofollow`,children:[(0,o.jsx)(t.code,{children:`@wordpress/dataviews`}),` README`]}),` for API reference and usage guidance.`]}),`
`,(0,o.jsxs)(t.h4,{id:`admin-ui-wordpressadmin-ui`,children:[`Admin UI (`,(0,o.jsx)(t.code,{children:`@wordpress/admin-ui`}),`)`]}),`
`,(0,o.jsx)(t.p,{children:`High-level building blocks for consistent WordPress admin page layouts:`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Page structure`}),`: Abstractions for pages, sidebars, headers, and navigation that encode the expected shape of an admin screen.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Consistency by default`}),`: Enforces a predictable admin experience across features without each team re-deriving the same layout patterns.`]}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[`See the `,(0,o.jsxs)(t.a,{href:`https://github.com/WordPress/gutenberg/tree/trunk/packages/admin-ui`,rel:`nofollow`,children:[(0,o.jsx)(t.code,{children:`@wordpress/admin-ui`}),` README`]}),` for API reference and usage guidance.`]}),`
`,(0,o.jsx)(t.h2,{id:`principles-of-the-design-system`,children:`Principles of the Design System`}),`
`,(0,o.jsxs)(t.p,{children:[`The design system is guided by a few principles that distinguish it from the existing `,(0,o.jsx)(t.a,{href:`https://github.com/WordPress/gutenberg/tree/trunk/packages/components`,rel:`nofollow`,children:`@wordpress/components`}),` package:`]}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Cohesive by design`}),`: Unlike `,(0,o.jsx)(t.code,{children:`@wordpress/components`}),`, which grew organically as a collection of unrelated UI elements, this design system guarantees user- and developer-facing cohesion through a unified token system and consistent component patterns.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Flexible theming`}),`: Built from the ground up to support customizable color schemes and user personalization—capabilities needed to support the `,(0,o.jsx)(t.a,{href:`https://github.com/WordPress/gutenberg/issues/71196`,rel:`nofollow`,children:`Phase 3 admin redesign initiative`}),`.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Modern distribution`}),`: Distributed as a versioned npm package following `,(0,o.jsx)(t.a,{href:`https://semver.org/`,rel:`nofollow`,children:`semantic versioning`}),`, rather than being bundled as a WordPress script on the `,(0,o.jsx)(t.code,{children:`window.wp`}),` global.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Composable architecture`}),`: Components follow consistent patterns with proper composability, ref forwarding, and flexible rendering—avoiding the bloated abstractions that emerged from historical scope creep.`]}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[`For more context on the motivations and goals behind this work, see the `,(0,o.jsx)(t.a,{href:`https://github.com/WordPress/gutenberg/issues/71196`,rel:`nofollow`,children:`Design System: Support for admin redesign`}),` overview issue.`]}),`
`,(0,o.jsx)(t.h2,{id:`contributing`,children:`Contributing`}),`
`,(0,o.jsxs)(t.p,{children:[`If a component, token, or guideline falls short of what you need, report it rather than working around it quietly. `,(0,o.jsx)(t.a,{href:`?path=/docs/design-system-contributing--docs`,children:`Contributing to the Design System`}),` covers how to report a shortcoming and how to fix it at the source. It applies to AI agents as much as to people.`]})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var o;function init_introduction(){return(init_introduction=e((()=>{o=r(),a(),t()})))()}init_introduction();export{MDXContent as default};