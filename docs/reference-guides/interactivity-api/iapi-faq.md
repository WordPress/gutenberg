# Frequently Asked Questions

## How does the Interactivity API work under the hood?

Its three main components are:

- [Preact](https://preactjs.com/) combined with [Preact Signals](https://preactjs.com/guide/v10/signals/) for hydration, client logic, and client-side navigation.
- HTML Directives that can be understood by both the client and server.
- Server-side logic, handled by the [HTML_Tag_Processor](https://make.wordpress.org/core/2023/03/07/introducing-the-html-api-in-wordpress-6-2/).

## Why Preact to build the directives system? Why not React or another JavaScript framework?

Preact has a number of advantages over React and other JavaScript frameworks like Vue, Svelte, or Solid in the context of the frontend (which is the focus of the Interactivity API):

- It’s small: 8kB, including [hooks](https://preactjs.com/guide/v10/hooks/) and [signals](https://preactjs.com/blog/introducing-signals/).
- It gives us DOM diffing out of the box.
- It’s extremely extensible through their Option Hooks. They use that extensibility for the hooks (preact/hooks), compatibility with React (preact/compat) and their signals (@preact/signals). Basically, everything but the DOM diffing algorithm.
- Its core team has been great and very helpful. They are also interested in enhancing this “island-based” usage of Preact.

## Is Gutenberg going to move from React to Preact since the Interactivity API uses it?

No. At the moment, there are no plans to make that transition. The requirements and advantages of the editor, as a fully interactive application, are quite different. Preact does have a [`@preact/compat`](https://preactjs.com/guide/v10/switching-to-preact/) package that enables full compatibility with the React ecosystem, and many large web applications use it. However, using Preact in the block editor would not offer advantages like it does on the frontend in the Interactivity API.

## What approaches have been considered instead of using directives?

Many alternative approaches were considered. Here’s a brief summary of some of them:

### React and other JavaScript frameworks

React was considered first because Gutenberg developers are familiar with it. Other popular JS frameworks like Svelte, Vue.js, or Angular were also considered, but none of them (including React) are PHP-friendly or compatible with WordPress hooks or internationalization.

### Alpine.js

Alpine.js is a great framework, and it inspired a lot of functionality in the Interactivity API. However, it doesn’t support server-side rendering of its [directives](https://github.com/alpinejs/alpine/tree/d7f9d641f7a763c56c598d118bd189a406a22383/packages/docs/src/en/directives), and having a similar system tailored for WordPress blocks has many benefits.

Preact was chosen instead of Alpine.js for numerous reasons, such as its smaller size, its better performance (especially with the addition of [signals](https://preactjs.com/guide/v10/signals/)), the fact that custom directives are written with Preact’s declarative syntax and tooling (hooks, signals), it’s more battle-tested and has a larger community than Alpine.js. It’s also compatible with React (for sharing client-side rendered components from the Editor), and it provides to the Interactivity API the fastest DOM diffing algorithm out of the box, including UI state preservation.

Furthermore, with Preact operating in the background, the Interactivity API manages "the final layer" so it can be better adapted to WordPress requirements. For example, JavaScript expressions are not allowed inside directives to avoid security risks and ensure compliance with strict security policies, and all WordPress directives are spec-compliant HTML attributes.

<div class="callout callout-info">
  Have a look at the conversation at <a href="https://github.com/WordPress/gutenberg/discussions/53022#discussioncomment-4696611">"Why Preact instead of Alpine?"</a> to learn more about this.
</div>


### Plain JavaScript

See the answer below. 

### Template DSL

The possibility of creating a [DSL](https://en.wikipedia.org/wiki/Domain-specific_language) for writing interactive templates was also researched. The code written in that Template DSL would then be compiled into both JavaScript and PHP. However, creating a production-grade Template compiler is complex and would be a large and risky investment of effort. This approach is still being considered for the future, with the directives serving as a compilation target.

## Why should I, as a block developer, use the Interactivity API rather than React?

Using React on the frontend doesn’t work smoothly with server rendering in PHP. Every approach that uses React to render blocks has to load content using client-side JavaScript. If you only render your blocks on the client, it typically results in a poor user experience because the user stares at empty placeholders and spinners while waiting for content to load. 

Using JS in PHP extensions (like v8js) is also possible, but unfortunately PHP extensions are not backward compatible and can only be used when there's a PHP fallback.

Now, it’s possible to server-render a block in PHP **and** use React to render the same block on the frontend. However, this results in a poor developer experience because the logic has to be duplicated across the PHP and React parts. Not only that, but you have now exposed yourself to subtle bugs caused by WordPress hooks!

Imagine installing a third-party plugin with a hook (filter) that modifies the server-rendered HTML. Let’s say this filter adds a single CSS class to your block’s HTML. That CSS class will be present in the server-rendered markup. On the frontend, your block will render again in React, but now the content will not include that CSS class because there is no way to apply WordPress hooks to React-rendered content!

On the other hand, the Interactivity API is designed to work perfectly with WordPress hooks because directives enhance the server-rendered HTML with behaviors. This also means it works out of the box with WordPress backend APIs like i18n.

To summarize, using the Interactivity API rather than just using React comes with these benefits:

- If you use React, your interactive blocks must generate the same markup on the client as they do on the server in PHP. Using the Interactivity API, there is no such requirement as directives are added to server-rendered HTML.
- The Interactivity API is PHP-friendlier. It works out of the box with WordPress hooks or other server functionalities such as internationalization. For example, with React, you can’t know which hooks are applied on the server, and their modifications would be overwritten after hydration.
- All the benefits of [using a standard](/docs/reference-guides/interactivity-api/iapi-about.md#why-a-standard).


## What are the benefits of Interactivity API over just using jQuery or vanilla JavaScript?

The main difference is that the Interactivity API is **declarative and reactive**, so writing and maintaining complex interactive experiences should become way easier. Additionally, it has been **specially designed to work with blocks**, providing a standard that comes with the benefits mentioned above, like inter-block communication, compatibility, or site-wide features such as client-side navigation.

Finally, comparing it with jQuery, **the Interactivity API runtime is ~10kb**, which is much more lightweight. Actually, there is an ongoing effort to remove heavy frameworks like jQuery across the WordPress ecosystem, and this would help in this regard.

## Do I need to know React, PHP, and this Interactivity API?

If you want to add frontend interactivity to your blocks using this API, the short answer is yes. If your block is not interactive, the block creation workflow will remain exactly the same.

The Interactivity API introduces a new standard method to facilitate the integration of interactive behaviors into the frontend part of WordPress. This means that you still need to use React to handle the editor part of your blocks.

On the other hand, if you want to create an interactive block, with the Interactivity API you don’t have to deal with complex topics like tooling, integration with WordPress, inter-block communication, or the server-side rendering of the interactive parts.

## Can the Interactivity API be used beyond a block?

Absolutely, yes, it is not limited to blocks. You'll see a lot of mentions of how the Interactivity API provides a standard for creating interactive blocks, but that's only because that's the most common use case. More generally speaking, the Interactivity API standard can be used to add "interactive behaviors" to the front end of any part of WordPress.

See the [`wp_interactivity_process_directives` function](https://developer.wordpress.org/reference/functions/wp_interactivity_process_directives/) for details on using the Interactivity API outside of blocks with arbitrary HTML.

## Does this mean I must migrate all my interactive blocks to use this API?

No. Blocks outside the Interactivity API can coexist with blocks using it. However, as explained above, keep in mind that there are some benefits for blocks that use the API:

- **Blocks can communicate with each other easily**. With a standard, this communication is handled by default. When different blocks use different approaches to frontend interactivity, inter-block communication becomes more complex and gets almost impossible when separate developers create blocks.
- **Composability and compatibility**: You can combine interactive blocks, nest them in structures with defined behaviors, and, thanks to following the same standard, they are fully cross-compatible. If each block were to use a different approach to interactivity, they would likely break.
- **Fewer KBs will be sent to the browser**. If each plugin author uses a different JS framework, more code will be loaded in the frontend. If all the blocks use the same one, the code is reused.
- If all the blocks on a page use this standard, site-wide features like client-side navigation can be enabled.

## What are the performance implications of using this API? Is it worth loading the Interactivity API for very simple use cases?

The API has been designed with performance in mind, so it shouldn’t be a problem:

- **The runtime code needed for the directives is just ~10 KB**, and it only needs to be loaded once for all the blocks.
- **All the script modules that belong to the Interactivity API (including the `view.js` files) will load without blocking the page rendering.**
- There are [ongoing explorations](https://github.com/WordPress/gutenberg/discussions/52723) about the possibility of **delaying the scripts loading once the block is in the viewport**. This way, the initial load would be optimized without affecting the user experience.

## Does it work with the Core Translation API?

As the Interactivity API works perfectly with server-side rendering, you can use all the WordPress APIs including [`__()`](https://developer.wordpress.org/reference/functions/__/) and [`_e()`](https://developer.wordpress.org/reference/functions/_e/). You can use it to translate the text in the HTML (as you normally would) and even use it inside the store when [using `wp_interactivity_state()` on the server side](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/api-reference/#setting-the-store). It might look something like this:

```php
// render.php
wp_interactivity_state( 'favoriteMovies', array(
      "1" => array(
        "id" => "123-abc",
        "movieName" => __("someMovieName", "textdomain")
      ),
) );
```

A translation API compatible with script modules (needed for the Interactivity API) is currently being worked on. Check [#60234](https://core.trac.wordpress.org/ticket/60234) to follow the progress on this work.

## I’m concerned about XSS; can JavaScript be injected into directives?

No. The Interactivity API only allows for [References](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/api-reference/#values-of-directives-are-references-to-store-properties) to be passed as values to the directives. This way, there is no need to eval() full JavaScript expressions, so it’s not possible to perform XSS attacks.

## Does this work with Custom Security Policies?

Yes. The Interactivity API does not use [`eval()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) or the [`Function()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function) constructor, so it doesn’t violate the [`unsafe-eval`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#unsafe_keyword_values) content security policy. It is also designed to work with any [custom content security policy](https://developer.wordpress.org/apis/security/).

## Can you use directives to make AJAX/REST-API requests?

Sure. Actions and callbacks called by directives can do anything a JavaScript function can, including making API requests.

