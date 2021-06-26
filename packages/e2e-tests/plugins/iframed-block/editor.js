( ( { wp: { element, blocks, blockEditor }, jQuery: $ } ) => {
	const { createElement: el, useEffect, useRef } = element;
	const { registerBlockType } = blocks;
	const { useBlockProps } = blockEditor;

	registerBlockType( 'test/iframed-block', {
        edit: function Edit() {
            const ref = useRef();
            useEffect( () => {
                $( ref.current ).test();
            } );
            return el( 'p', useBlockProps( { ref } ), 'Iframed Block (edit)' );
        },
        save: function Save() {
            return el( 'p', useBlockProps.save(), 'Iframed Block (saved)' );
        },
	} );
} )( window );
