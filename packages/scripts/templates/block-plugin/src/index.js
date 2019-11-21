/* global wp */
/**
 * WordPress dependencies
 */
const { registerBlockType } = wp.blocks;

registerBlockType( 'block-plugin-name/block-plugin-block-name', {
	title: 'block-plugin-block-title',
	category: 'common',
	edit: () => <div>Editor</div>,
	save: () => <div>Front End</div>,
} );
