# Autocomplete

<p class="callout callout-alert">This component is deprecated and no longer provides autocompletion: it renders its children as they are. Pass completers to the `RichText` component through its `autocompleters` prop.</p>

The autocompleter interface is documented with the `RichText` component's `autocompleters` prop. Completers passed to `RichText` still go through the `editor.Autocomplete.completers` filter, which gives developers an opportunity to override or extend them.
