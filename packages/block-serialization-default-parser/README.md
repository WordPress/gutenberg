# Block Serialization Default Parser

This library contains the default block serialization parser implementations for WordPress documents. It provides native PHP and JavaScript parsers that implement the specification from `@wordpress/block-serialization-spec-parser` and which normally operates on the document stored in `post_content`.

## Installation

Install the module

```bash
npm install @wordpress/block-serialization-default-parser --save
```

## Usage

```js
import { parse } from '@wordpress/block-serialization-default-parser';

parse( '<!-- wp:core/more --><!--more--><!-- /wp:core/more -->' ) === [
    {
        "attrs": null,
        "blockName": "core/more",
        "innerBlocks": [],
        "innerHTML": "<!--more-->"
    }
]
```

## Theory

### What is different about this one from the spec-parser?

This is a recursive-descent parser that scans linearly once through the input document. Instead of directly recursing it utilizes a trampoline mechanism to prevent stack overflow. It minimizes data copying and passing through the use of globals for tracking state through the parse. Between every token (a block comment delimiter) we can instrument the parser and intervene should we want to; for example we might put a hard limit on how long we can be parsing a document or provide additional debugging diagnostics for a document.

The spec parser is defined via a _Parsing Expression Grammar_ (PEG) which answers many questions inherently that we must answer explicitly in this parser. The goal for this implementation is to match the characteristics of the PEG so that it can be directly swapped out and so that the only changes are better runtime performance and memory usage.

### How does it work?

It's pretty self-explanatory...haha just kidding.

Every Gutenberg document is nominally an HTML document which in addition to normal HTML may also contain specially designed HTML comments - the block comment delimiters - which separate and isolate the blocks which are serialized in the document.

This parser attempts to create a state-machine around the transitions triggered from those delimiters - the "tokens" of the grammar. Every time we find one we should only be doing one of a small set of actions:

 - enter a new block
 - exit out of a block

Those actions have different effects depending on the context; for instance, when we exit a block we either need to add it to the output block list _or_ we need to append it as the next `innerBlock` on the parent block below it in the block stack (the place where we track open blocks). The details are documented below.

The biggest challenge in this parser is making the right accounting of indices required to to construct the `innerHTML` values for each block at every level of nesting depth. We take a simple approach:

 - start each newly-opened block with an empty `innerHTML`
 - whenever we push a first block into the `innerBlocks` list then add the content from where the content of the parent block started to where this inner block starts
 - whenever we push another block into the `innerBlocks` list then add the content from where the previous inner block ended to where this inner block starts
 - when we close out an open block we add the content from where the last inner block ended to where the closing block delimiter starts
 - if there are no inner blocks then we take the entire content between the opening and closing block comment delimiters as the `innerHTML`

### I meant, how does it perform?

This parser operates much faster than the generated parser from the specification. Because we know more about the parsing than the PEG does we can take advantage of several tricks to improve our speed and memory usage:

 - we only have one or two distinct tokens depending on how you look at it and they are all readily matched via a regular expression. instead of parsing on a character-per- character basis we can allow the PCRE RegExp engine skip over large swaths of the document for us in order to find those tokens.
 - since `preg_match()` takes an `offset` parameter we can crawl through the input without passing copies of the input text on every step. we can track our position in the string and only pass a number instead
 - not copying all those strings means that we'll also skip many memory allocations

Further since we're tokenizing with a RegExp we have an additional advantage. The generated parser from the PEG provides predictable performance characteristics and in order to do that must control how things are tokenized - it doesn't allow us to define RegExp patterns in the rules because doing so could introduce bad things like cataclysmic backtracking and that breaks the PEG guarantees.

However, since our "token language" of the block comment delimiters is _regular_ and _can_ be trivially matched with RegExp patterns we can do that here and then something magical happens: we jump out of PHP or JavaScript and into a highly-optimized RegExp engine written in C or C++ on the host system. We leave the virtual machine and its overhead.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
