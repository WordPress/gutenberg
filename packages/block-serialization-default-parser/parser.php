<?php

class BSDP_Block {
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

class BSDP_Frame {
    public $block;
    public $token_start;
    public $token_length;
    public $prev_offset;
    public $leading_html_start;

    function __construct( $block, $token_start, $token_length, $prev_offset = null, $leading_html_start = null ) {
        $this->block = $block;
        $this->token_start = $token_start;
        $this->token_length = $token_length;
        $this->prev_offset = isset($prev_offset) ? $prev_offset : $token_start + $token_length;
        $this->leading_html_start = $leading_html_start;
    }
}

class BSDP_Parser {
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
            // twiddle our thumbs
        } while ( $this->proceed() );

        return $this->output;
    }

    function proceed() {
        list( $token_type, $block_name, $attrs, $start_offset, $token_length ) = $this->next_token();
        $stack_depth = count( $this->stack );

        switch ( $token_type ) {
            case 'no-more-tokens':
                // if not in a block then flush output
                if ( 0 === $stack_depth ) {
                    $this->add_freeform();
                    return false;
                }

                /*
                 * Otherwise we have a problem
                 * This is an error
                 *
                 * we have options
                 * - treat it all as freeform text
                 * - assume an implicit closer (easiest when not nesting)
                 */

                // for the easy case we'll assume an implicit closer
                if ( 1 === $stack_depth ) {
                    $this->add_block_from_stack();
                    return false;
                }

                /*
                 * for the nested case where it's more difficult we'll
                 * have to assume that multiple closers are missing
                 * and so we'll collapse the whole stack piecewise
                 */
                while ( 0 < count( $this->stack ) ) {
                    $this->add_block_from_stack();
                }
                return false;

            case 'void-block':
                /*
                 * easy case is if we stumbled upon a void block
                 * in the top-level of the document
                 */
                if ( 0 === $stack_depth ) {
                    $this->output[] = new BSDP_Block( $block_name, $attrs, array(), '' );
                    $this->offset = $start_offset + $token_length;
                    return true;
                }

                // otherwise we found an inner block
                $this->add_inner_block(
                    new BSDP_Block( $block_name, $attrs, array(), '' ),
                    $start_offset,
                    $token_length
                );
                $this->offset = $start_offset + $token_length;
                return true;

            case 'block-opener':
                // we may have some HTML soup before the next block
                $leading_html_start = $start_offset > $this->offset ? $this->offset : null;

                // track all newly-opened blocks on the stack
                array_push( $this->stack, new BSDP_Frame(
                    new BSDP_Block( $block_name, $attrs, array(), '' ),
                    $start_offset,
                    $token_length,
                    $start_offset + $token_length,
                    $leading_html_start
                ) );
                $this->offset = $start_offset + $token_length;
                return true;

            case 'block-closer':
                /*
                 * if we're missing an opener we're in trouble
                 * This is an error
                 */
                if ( 0 === $stack_depth ) {
                    /*
                     * we have options
                     * - assume an implicit opener
                     * - assume _this_ is the opener
                     * - give up and close out the document
                     */
                    $this->add_freeform();
                    return false;
                }

                // if we're not nesting then this is easy - close the block
                if ( 1 === $stack_depth ) {
                    $this->add_block_from_stack( $start_offset );
                    $this->offset = $start_offset + $token_length;
                    return true;
                }

                /*
                 * otherwise we're nested and we have to close out the current
                 * block and add it as a new innerBlock to the parent
                 */
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
                // This is an error
                $this->add_freeform();
                return false;
        }
    }

    function next_token() {
        $matches = null;

        /*
         * aye the magic
         * we're using a single RegExp to tokenize the block comment delimiters
         * we're also using a trick here because the only difference between a
         * block opener and a block closer is the leading `/` before `wp:` (and
         * a closer has no attributes). we can trap them both and process the
         * match back in PHP to see which one it was.
         */
        $has_match = preg_match(
            '/<!--\s+(?<closer>\/)?wp:(?<namespace>[a-z][a-z0-9_-]*\/)?(?<name>[a-z][a-z0-9_-]*)\s+(?<attrs>{(?:(?!}\s+-->).)+}\s+)?(?<void>\/)?-->/s',
            $this->document,
            $matches,
            PREG_OFFSET_CAPTURE,
            $this->offset
        );

        // we have no more tokens
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

        /*
         * This state isn't allowed
         * This is an error
         */
        if ( $is_closer && ( $is_void || $has_attrs ) ) {
            // we can ignore them since they don't hurt anything
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

    function add_inner_block(BSDP_Block $block, $token_start, $token_length, $last_offset = null ) {
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

        if ( isset( $stack_top->leading_html_start ) ) {
            $this->output[] = array(
                'attrs' => array(),
                'innerHTML' => substr(
                    $this->document,
                    $stack_top->leading_html_start,
                    $stack_top->token_start - $stack_top->leading_html_start
                ),
            );
        }

        $this->output[] = $stack_top->block;
    }
}

function bdsp_select_parser( $prev_parse_class ) {
    return 'BSDP_Parser';
}

add_filter( 'block_parser_class', 'bdsp_select_parser', 10, 1 );
