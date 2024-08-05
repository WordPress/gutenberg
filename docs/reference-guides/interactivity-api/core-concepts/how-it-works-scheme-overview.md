To get a complete picture of how the API works, let's review a request to the imagined `/interactive` page.

The `/interactive` page is a plain page that contains an interactive "accordion" block among static content. In this
case, the request will pass through the following phases:

## Part A: Backend

### 1. Initial processing

The initial request to the `/interactive` page is processed by WordPress, and all the hooks are fired as usual.

### 2. Page body HTML generation

At this stage, the current theme generates markup for the current request. During it, the place with the interactive
accordion block
is reached:

```php
<?php wp_interactivity_state('accordion', ['isClosed' => true]); ?>

<div data-wp-interactive="accordion"
   <?php echo wp_interactivity_data_wp_context(["openItemMessage" => __('Current open item is', 'domain'), "closedItemMessage" => __('Items are closed.', 'domain')]); ?>
   data-wp-class--dark="state.isDark">
        <div class='accordion__panel'>
           <div class='accordion__heading-opened' data-wp-bind--hidden="state.isClosed">
               <span data-wp-text="context.openItemMessage"></span>
               <span class='accordion__open-item-name'></span>
           </div>
           <div class='accordion__heading-closed' data-wp-bind--hidden="context.isOpen">
               <span data-wp-text="context.closedItemMessage"></span>
           </div>
       </div>
</div>
```

Note: The `wp_interactivity_state` and `wp_interactivity_data_wp_context` calls are optional,
while `data-wp-interactive="accordion"` is a necessary directive that defines our block.

The following will happen:

#### 2.1) The `wp_interactivity_state` call defines the state variables of our block.

It's stored in a global variable that keeps state of all blocks throughout the request.

#### 2.2) The `wp_interactivity_data_wp_context` call turns the passed variables into a data attribute with JSON.

In this example, the defined strings will be translated (if needed) and turned into the `data-wp-context` attribute:

```html
data-wp-context='{"openItemMessage":"Current open item is","closedItemMessage":"Items are closed"}
```

#### 2.3) WordPress, upon encountering `data-wp-interactive="accordion"`, processes the block directives.

In this case, there are 5 directives to be processed: 2 `data-wp-bind--hidden`, 2 `data-wp-text`
and `data-wp-class--dark`. Using the HTML
API and defined data (state in the global block-related PHP variable and variables as JSON attributes), WordPress will
process them and change the markup.

As a result, the span will contain the translated text, and the hidden attribute
will be added to the matching (first) item. The `data-wp-class--dark` directive will be skipped, as no such state is
available. This is a client-only state, which will be defined on the client side.

### 3. Scripts enqueuing

#### 3.1) WP automatically adds the `interactivity.min.js` script alias.

Besides adding the `<script>` tags for all the
assets used on the page, WP will automatically add the `@wordpress/interactivity` alias, pointing to
the `/wp-includes/js/dist/interactivity.min.js` script. This happens only on pages that have used at least one
interactive block.
[how-it-works-scheme-overview.md](how-it-works-scheme-overview.md)

#### 3.2) WP automatically enqueues the block script (only for Gutenberg blocks).

The Interactivity API blocks have their own JavaScript, which defines actions, and this JavaScript is automatically
enqueued by WordPress. In the case of the accordion block, the JS code defines only a single client-side state variable:

```js
import {store, getContext, getElement} from '@wordpress/interactivity';

const {state} = store('accordion', {
	state: {
		isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
	}
});
```

Pay attention, that automatic enqueueing happens only within Gutenberg blocks. Otherwise, the script should be enqueued
manually.

Note: the fact that the API script alias was added, doesn't mean loading the asset in browser. The API script will
be loaded (once) during the import command processing in the block JS:

```javascript
import {store, getContext, getElement} from '@wordpress/interactivity';
```

If the block has no JS code, the interactivity JS won't be enqueued. It may look confusing, but after considering it,
it becomes clear that no block JS means no actions and no client-side states, so the server will deliver the final
markup, which won't have any changes down the line.

As soon as some client changes are necessary, JS code is added, and the script is enqueued.

#### 3.2) State variables are added as JSON:

State variables of all the blocks, appeared on the page, are added as JSON inside a dedicated `<script>` tag:

 ```html

<script type="application/json" id="wp-interactivity-data">
	{"state":{"accordion":{"isClosed":true}}}
</script>
   ```

In this case, the single accordion block state is added.

### 4. HTML sending

After this, the generated HTML is sent to the client side.

## Part B: Client side

On the client side, the page will be processed as usual: the markup is parsed, JS & CSS are loaded, and the
usual `DOMContentLoaded` and `window.load` events are fired.

### 1. Interactivity script initial processing

After being loaded by the browser, during initialization, the script will read all the data, attach listeners, and
process directives that contain JS-only state variables.

A block can have directives with state variables defined only in the block's JS. In the accordion example, the dark
class directive was used (`data-wp-class--dark="state.isDark"`).

It was omitted on the server side due to the
missing state variable. Now, on the client side, the related directive will be processed, and if the dark theme is in
use, the class will be added:

```javascript
import {store, getContext, getElement} from '@wordpress/interactivity';

const {state} = store('accordion', {
	state: {
		isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
	}
});
```

The client-side-only approach for state variables should only be used when there are specific requirements, cause unlike
server-processed directives, it isn't SEO-friendly.

### 2. Interactivity actions and changes processing

Then, the usual DOM lifecycle happens, with events and DOM changes. Thanks to the Interactivity API, which provides a
great abstraction and eliminates the need for manual querying and changes of DOM nodes, it's easy to fully focus on the
logic itself.

## Part 3: How to 'Enable' iAPI

It's important to highlight that adding the `data-wp-interactive="accordion"` directive is necessary for a block
declaration but doesn't cause the directives to be processed or the Interactivity script to be enqueued by default.

In case it's been added right now in some place on a new page, nothing will happen. This is because, for performance
reasons,
the Interactivity API isn't applied to all the HTML, and requires 'activation'.

There are two ways to do so:

### 1. Inside the custom Gutenberg blocks

When using the Interactivity API inside Gutenberg blocks, it's necessary to enable the related option
in `block.json`. After that, WordPress will look for the `data-wp-interactive` directive and process it.

### 2. In any place to any HTML

Fortunately, Interactivity API is public, and besides Gutenberg blocks, it can be used in any place. However, in
addition to the
above-mentioned snippet, it'll require a couple of things to be done manually:

#### 2.1) Call of the `wp_interactivity_process_directives` function on the target markup.

In a straightforward way, it can be done as follows:

```php
wp_interactivity_state('accordion', ['isOpen' => false]);

ob_start();
 ?>

<div class="accordion" data-wp-interactive="accordion">
	<!-- inner HTML elements here -->
</div>

<?php
$html = (string) ob_get_clean();
echo wp_interactivity_process_directives($html);
```

#### 2.2) Enqueueing the block's JS and using the full path to `interactivity.min.js`.

Since no Gutenberg block with the Interactivity API is present, WordPress won't create the `@wordpress/interactivity`
alias, and won't enqueue the block's JavaScript code automatically.

This means that the block's JS code should be added to the theme's JavaScript file and enqueued manually.
Additionally, in the block's JS snippet, the full path should be used:

```javascript
import {store, getContext, getElement} from '/wp-includes/js/dist/interactivity.min.js';

const {state} = store('accordion', {
	state: {
		isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
	}
});

// the other theme's JS code
```

That's allow to apply the Interactivity API to any HTML, even if it has no relation to Gutenberg blocks.
