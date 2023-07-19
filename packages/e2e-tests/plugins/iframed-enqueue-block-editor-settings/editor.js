// Test changing styles dynamically.
const settings = window.wp.data.select( 'core/editor' ).getEditorSettings();
wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
    ...settings,
    styles: [
        ...settings.styles,
        {
            css: 'p { border-width: 2px; }',
        },
    ],
} );
console.log( window.wp.data.select( 'core/editor' ).getEditorSettings() )
