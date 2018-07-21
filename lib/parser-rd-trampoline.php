<?php

/**
 * Implements the formal specification for parsing Gutenberg documents
 * serialized into HTML (nominally in `post_content` of a WordPress post)
 *
 * @see https://github.com/WordPress/gutenberg/tree/master/packages/block-serialization-spec-parser
 *
 * ## What is different about this one from the spec-parser?
 *
 * This is a recursive-descent parser that scans linearly once through the input document.
 * Instead of directly recursing it utilizes a trampoline mechanism to prevent stack overflow.
 * In order to minimize data copying and passing it's built into a class with class properties.
 * Between every token (a block comment delimiter) we can instrument the parser and intervene.
 *
 * The spec parser is defined via a _Parsing Expression Grammar_ (PEG) which answers many
 * questions inherently that we must answer explicitly in this parser. The goal for this
 * implementation is to match the characteristics of the PEG so that it can be directly
 * swapped out so that the only changes are better runtime performance and memory usage.
 *
 * ## How does it work?
 *
 * It's pretty self-explanatory...haha
 *
 * Every Gutenberg document is nominally an HTML document which in addition to normal HTML may
 * also contain specially designed HTML comments - the block comment delimiters - which separate
 * and isolate the blocks which are serialized in the document.
 *
 * This parser attempts to create a kind of state-machine around the transitions triggered from
 * those delimiters - the "tokens" of the grammar. Every time we find one we should only be doing
 * one of a small set of actions:
 *
 *  - enter a new block
 *  - exit out of a block
 *
 * Those actions have different effects depending on the context; for instance, when we exit a
 * block we either need to add it to the output block list _or_ we need to append it as the
 * next `innerBlock` on the parent block below it in the block stack (the place where we track
 * open blocks). The details are documented below.
 *
 * The biggest challenge in this parser is making the right accounting of indices required to
 * to construct the `innerHTML` values for each block at every level of nesting depth. We take
 * a simple approach:
 *
 *  - start each newly-opened block with an empty `innerHTML`
 *  - whenever we push a first block into the `innerBlocks` list then add the content from
 *    where the content of the parent block started to where this inner block starts
 *  - whenever we push another block into the `innerBlocks` list then add the content from
 *    where the previous inner block ended to where this inner block starts
 *  - when we close out an open block we add the content from where the last inner block
 *    ended to where the closing block delimiter starts
 *  - if there are no inner blocks then we take the entire content between the opening and
 *    closing block comment delimiters as the `innerHTML`
 *
 * ## I meant, how does it perform?
 *
 * This parser operates much faster than the generated parser from the specification.
 * Because w know more about the parsing than the PEG does we can take advantage of several
 * tricks to improve our speed and memory usage:
 *
 *  - we only have one or two distinct tokens depending on how you look at it and they are
 *    all readily matched via a regular expression. instead of parsing on a character-per-
 *    character basis we can allow the PCRE RegExp engine skip over large swaths of the
 *    document for us in order to find those tokens.
 *  - since `preg_match()` takes an `offset` parameter we can crawl through the input
 *    without passing copies of the input text on every step. we can track our position
 *    in the string and only pass a number instead
 *  - not copying all those strings means that we'll also skip many memory allocations
 *
 */

function rdt_parse( $document ) {
    static $parser;

    if ( ! isset( $parser ) ) {
        $parser = new RDT_Parser();
    }

    return $parser->parse( $document );
}

class RDT_Block {
    public $blockName;
    public $attrs;
    public $innerBlocks;
    public $innerHTML;

    function __construct( $name, $attrs, $innerBlocks, $innerHTML ) {
        $this->blockName   = $name;
        $this->attrs       = $attrs;
        $this->innerBlocks = $innerBlocks;
        $this->innerHTML   = $innerHTML;
    }
}

class RDT_Frame {
    public $block;
    public $token_start;
    public $token_length;
    public $prev_offset;

    function __construct( $block, $token_start, $token_length, $prev_offset = null ) {
        $this->block        = $block;
        $this->token_start  = $token_start;
        $this->token_length = $token_length;
        $this->prev_offset  = isset( $prev_offset ) ? $prev_offset : $token_start + $token_length;
    }
}

class RDT_Parser {
    public $document;
    public $offset;
    public $output;
    public $stack;

    function parse( $document ) {
        $this->document = $document;
        $this->offset   = 0;
        $this->output   = array();
        $this->stack    = array();

        do {
            # twiddle our thumbs
        } while ( $this->proceed() );

        return $this->output;
    }

    function proceed() {
        list( $token_type, $block_name, $attrs, $start_offset, $token_length ) = $this->next_token();
        $stack_depth = count( $this->stack );

        switch ( $token_type ) {
            case 'no-more-tokens':
                # if not in a block then flush output
                if ( 0 === $stack_depth ) {
                    $this->add_freeform();
                    return false;
                }

                # Otherwise we have a problem
                # This is an error
                $this->error( 'in a block but found no closer' );
                $this->error( 'failed at ' . $this->offset );

                # we have options
                #  - treat it all as freeform text
                #  - assume an implicit closer (easiest when not nesting)

                # for the easy case we'll assume an implicit closer
                if ( 1 === $stack_depth ) {
                    $this->error( ' - treating as implicit closer' );
                    $this->add_block_from_stack();
                    return false;
                }

                # for the nested case where it's more difficult we'll
                # have to assume that multiple closers are missing
                # and so we'll collapse the whole stack piecewise
                $this->error( ' - multiple closers are missing' );
                $this->error( ' - recursively collapsing stack of blocks' );
                while ( 0 < count( $this->stack ) ) {
                    $this->add_block_from_stack();
                }
                return false;

            case 'void-block':
                # easy case is if we stumbled upon a void block
                # in the top-level of the document
                if ( 0 === $stack_depth ) {
                    $this->output[] = new RDT_Block( $block_name, $attrs, array(), '' );
                    $this->offset = $start_offset + $token_length;
                    return true;
                }

                # otherwise we found an inner block
                $this->add_inner_block(
                    new RDT_Block( $block_name, $attrs, array(), '' ),
                    $start_offset,
                    $token_length
                );
                $this->offset = $start_offset + $token_length;
                return true;

            case 'block-opener':
                # we may have some HTML soup before the next block
                if ( $start_offset > $this->offset ) {
                    self::add_freeform( $start_offset - $this->offset );
                }

                # track all newly-opened blocks on the stack
                array_push( $this->stack, new RDT_Frame(
                    new RDT_Block( $block_name, $attrs, array(), '' ),
                    $start_offset,
                    $token_length,
                    $start_offset + $token_length
                ) );
                $this->offset = $start_offset + $token_length;
                return true;

            case 'block-closer':
                # if we're missing an opener we're in trouble
                # This is an error
                if ( 0 === $stack_depth ) {
                    $this->error( 'found a closer with no opening block' );
                    $this->error( 'failed at offset ' . $start_offset );

                    # we have options
                    #  - assume an implicit opener
                    #  - assume _this_ is the opener
                    #  - give up and close out the document
                    $this->add_freeform();
                    return false;
                }

                # if we're not nesting then this is easy - close the block
                if ( 1 === $stack_depth ) {
                    $this->add_block_from_stack( $start_offset );
                    $this->offset = $start_offset + $token_length;
                    return true;
                }

                # otherwise we're nested and we have to close out the current
                # block and add it as a new innerBlock to the parent
                $stack_top = array_pop( $this->stack );
                $stack_top->block->innerHTML .= substr( $this->document, $stack_top->prev_offset, $start_offset - $stack_top->prev_offset );
                $stack_top->prev_offset = $start_offset + $token_length;

                $this->add_inner_block(
                    $stack_top->block,
                    $stack_top->token_start,
                    $stack_top->token_length,
                    $start_offset + $token_length
                );
                $this->offset = $start_offset + $token_length;
                return true;

            default:
                # This is an error
                $this->error( 'found unexpected token at offset ' . $this->offset );
                $this->add_freeform();
                return false;
        }
    }

    function next_token() {
        $matches = null;

        # aye the magic
        # we're using a single RegExp to tokenize the block comment delimiters
        # we're also using a trick here because the only difference between a
        # block opener and a block closer is the leading `/` before `wp:` (and
        # a closer has no attributes). we can trap them both and process the
        # match back in PHP to see which one it was.
        $has_match = preg_match(
            '/<!--\s+(?<closer>\/)?wp:(?<namespace>[a-z][a-z0-9_-]*\/)?(?<name>[a-z][a-z0-9_-]*)\s+(?<attrs>{(?:(?!}\s+-->).)+}\s+)?(?<void>\/)?-->/s',
            $this->document,
            $matches,
            PREG_OFFSET_CAPTURE,
            $this->offset
        );

        # we have no more tokens
        if ( 0 === $has_match ) {
            return array( 'no-more-tokens' );
        }

        list( $match, $started_at ) = $matches[ 0 ];

        $length     = strlen( $match );
        $is_closer  = isset( $matches[ 'closer' ] ) && -1 !== $matches[ 'closer' ][ 1 ];
        $is_void    = isset( $matches[ 'void' ] ) && -1 !== $matches[ 'void' ][ 1 ];
        $namespace  = $matches[ 'namespace' ];
        $namespace  = ( isset( $namespace ) && -1 !== $namespace[ 1 ] ) ? $namespace[ 0 ] : 'core/';
        $name       = $namespace . $matches[ 'name' ][ 0 ];
        $has_attrs  = isset( $matches[ 'attrs' ] ) && -1 !== $matches[ 'attrs' ][ 1 ];
        $attrs      = $has_attrs ? json_decode( $matches[ 'attrs' ][ 0 ] ) : null;

        # This state isn't allowed
        # This is an error
        if ( $is_closer && ( $is_void || $has_attrs ) ) {
            $this->error( 'closing comment delimiters must not have attributes or void closers' );
            $this->error( 'failed at offset ' . $started_at . ': ' . $match );

            # we can ignore them since they don't hurt anything
        }

        if ( $is_void ) {
            return array( 'void-block', $name, $attrs, $started_at, $length );
        }

        if ( $is_closer ) {
            return array( 'block-closer', $name, null, $started_at, $length );
        }

        return array( 'block-opener', $name, $attrs, $started_at, $length );
    }

    function add_freeform( $length = null ) {
        $length = $length ?: strlen( $this->document ) - $this->offset;

        if ( 0 === $length ) {
            return;
        }

        $this->output[] = array(
            'attrs'     => new stdClass(),
            'innerHTML' => substr( $this->document, $this->offset, $length ),
        );
    }

    function add_inner_block( RDT_Block $block, $token_start, $token_length, $last_offset = null ) {
        $parent = $this->stack[ count( $this->stack ) - 1 ];
        $parent->block->innerBlocks[] = $block;
        $parent->block->innerHTML .= substr( $this->document, $parent->prev_offset, $token_start - $parent->prev_offset );
        $parent->prev_offset = $last_offset ?: $token_start + $token_length;
    }

    function add_block_from_stack( $end_offset = null ) {
        $stack_top = array_pop( $this->stack );
        $prev_offset = $stack_top->prev_offset;

        $stack_top->block->innerHTML .= isset( $end_offset )
            ? substr( $this->document, $prev_offset, $end_offset - $prev_offset )
            : substr( $this->document, $prev_offset );

        $this->output[] = $stack_top->block;
    }

    function error( $message ) {
        # silence is golden
    }
}
