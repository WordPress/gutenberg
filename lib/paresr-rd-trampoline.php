<?php

class MyParser {
    public $document;
    public $offset;
    public $output;
    public $stack;

    function __construct( $document ) {
        $this->document = $document;
        $this->offset   = 0;
        $this->output   = array();
        $this->stack    = array();
    }

    function parse() {
        do {
            # twiddle our thumbs
        } while ( $this->proceed() );

        return $this->output;
    }

    function proceed() {
        list( $token_type, $block_name, $attrs, $start_offset, $token_length ) = $this->next_token();

        switch ( $token_type ) {
            case 'no-more-tokens':
                # if not in a block then flush output
                if ( 0 === count( $this->stack ) ) {
                    $this->add_freeform();
                    $this->offset = strlen( $this->document );
                    return false;
                }

                # Otherwise we have a problem
                # This is an error
                $this->error( 'in a block but found no closer' );
                $this->error( 'failed at ' . $this->offset );

                # we have options
                #  - treat it all as freeform text
                #  - assume an implicit closer (easiest when not nesting)

                # for the easy case we'll assume and implicit closer
                if ( 1 === count( $this->stack ) ) {
                    $this->error( ' - treating as implicit closer' );
                    $this->pop_stack();
                    $this->offset = strlen( $this->document );
                    return false;
                }

                # for the nested case where it's more difficult we'll
                # have to assume that multiple closers are missing
                # and so we'll collapse the whole stack piecewise
                $this->error( ' - multiple closers are missing' );
                $this->error( ' - recursively collapsing stack of blocks' );
                while ( 0 < count( $this->stack ) ) {
                    $this->pop_stack();
                }
                $this->offset = strlen( $this->document );
                return false;

            case 'void-block':
                # easy case is if we stumbled upon a void block
                # in the top-level of the document
                if ( 0 === count( $this->stack ) ) {
                    $this->add_block( $block_name, $attrs, array(), '' );
                    $this->offset = $start_offset + $token_length;
                    return true;
                }

                # otherwise we found an inner block
                $this->add_inner_block( $block_name, $attrs, array(), '' );
                $this->offset = $start_offset + $token_length;
                return true;

            case 'block-opener':
                $this->push_stack( $block_name, $attrs, $start_offset, $token_length );
                $this->offset = $start_offset + $token_length;
                return true;

            case 'block-closer':
                # if we're missing an opener we're in trouble
                # This is an error
                if ( 0 === count( $this->stack ) ) {
                    $this->error( 'found a closer with no opening block' );
                    $this->error( 'failed at offset ' . $start_offset );

                    # we have options
                    #  - assume an implicit opener
                    #  - assume _this_ is the opener
                    #  - give up and close out the document
                    $this->add_freeform();
                    $this->offset = strlen( $this->document );
                    return false;
                }

                # if we're not nesting then this is easy - close the block
                if ( 1 === count( $this->stack ) ) {
                    $this->pop_stack( $start_offset );
                    $this->offset = $start_offset + $token_length;
                    return true;
                }

                # otherwise we're nested and we have to close out the current
                # block and add it as a new innerBlock to the parent
                $block = array_pop( $this->stack );
                $this->add_inner_block( array(
                    'blockName'   => $block[ 0 ],
                    'attrs'       => $block[ 1 ],
                    'innerBlocks' => $block[ 2 ],
                    'innerHTML'   => substr( $this->document, $block[ 3 ] + $block[ 4 ], $start_offset - $block[ 3 ] - $block[ 4 ] ),
                ) );
                $this->offset = $start_offset + $token_length;
                return true;

            default:
                # This is an error
                $this->error( 'found unexpected token at offset ' . $this->offset );
                $this->add_freeform();
                $this->offset = strlen( $this->document );
                return false;
        }
    }

    function next_token() {
        $matches = null;

        $has_match = preg_match(
            '/<!--\s+(?<closer>\/)?wp:(?<name>[a-z][a-z0-9_-]*)\s+(?<attrs>{(?:(?!}\s+-->).)+}\s+)?(?<void>\/)?-->/',
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
        $name       = $matches[ 'name' ][ 0 ];
        $has_attrs  = isset( $matches[ 'attrs' ] ) && -1 !== $matches[ 'attrs' ][ 1 ];
        $attrs      = $has_attrs ? json_decode( $matches[ 'attrs' ][ 0 ] ) : new stdClass();

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

    function add_block( $block_name, $attrs, $inner_blocks, $inner_html ) {
        $this->output[] = array(
            'blockName'   => $block_name,
            'attrs'       => $attrs,
            'innerBlocks' => $inner_blocks,
            'innerHTML'   => $inner_html,
        );
    }

    function add_freeform( $length = null ) {
        $this->output[] = isset( $length )
            ? self::freeform( substr( $this->document, $this->offset, $length ) )
            : self::freeform( substr( $this->document, $this->offset ) );
    }

    function add_inner_block( $block ) {
        # optimized way of pushing new block onto $inner_blocks of parent stack block
        $this->stack[ count( $this->stack ) - 1 ][ 2 ][] = $block;
    }

    function push_stack( $block_name, $attrs, $start_offset, $length ) {
        array_push( $this->stack, array( $block_name, $attrs, array(), $start_offset, $length ) );
    }

    function pop_stack( $end_offset = null ) {
        list( $block_name, $attrs, $inner_blocks, $start_offset, $length ) = array_pop( $this->stack );

        $inner_html = isset( $end_offset )
            ? substr( $this->document, $start_offset + $length, $end_offset - $start_offset - $length )
            : substr( $this->document, $start_offset + $length );

        $this->output[] = array(
            'blockName'   => $block_name,
            'attrs'       => $attrs,
            'innerBlocks' => $inner_blocks,
            'innerHTML'   => $inner_html,
        );
    }

    function error( $message ) {
        error_log( $message );
    }

    static function freeform( $s ) {
        return array(
            'attrs'     => new stdClass(),
            'innerHTML' => $s,
        );
    }
}
