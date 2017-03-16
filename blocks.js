"use strict";

/**
 * Derived functions
 */
var getNextSibling = siblingGetter( 'next' );
var getPreviousSibling = siblingGetter( 'previous' );
var getTagType = getConfig.bind( null, 'tagTypes' );
var getTypeKinds = getConfig.bind( null, 'typeKinds' );
var setImageFullBleed = setElementState.bind( null, 'align-full-bleed' );
var setImageAlignNone = setElementState.bind( null, '' );
var setImageAlignLeft = setElementState.bind( null, 'align-left' );
var setImageAlignRight = setElementState.bind( null, 'align-right' );

var setTextAlignLeft = setElementState.bind( null, 'align-left' );
var setTextAlignCenter = setElementState.bind( null, 'align-center' );
var setTextAlignRight = setElementState.bind( null, 'align-right' );

/**
 * Globals
 */
var config = {
	tagTypes: {
		'BLOCKQUOTE': 'quote',
		'H1': 'heading',
		'H2': 'heading',
		'H3': 'heading',
		'H4': 'heading',
		'H5': 'heading',
		'H6': 'heading',
		'IMG': 'image',
		'P': 'paragraph',
		'default': 'paragraph'
	},
	typeKinds: {
		'quote': [ 'text' ],
		'heading': [ 'heading', 'text' ],
		'image': [ 'image' ],
		'paragraph': [ 'text' ],
		'default': []
	},
	blockCategories: [
		{ id: 'common', label: 'Common' },
		{ id: 'media', label: 'Media' },
		{ id: 'embeds', label: 'Embeds' },
		{ id: 'other', label: 'Other' },
		{ id: 'layout', label: 'Layout' }
	],
	blocks: [
	    {
	        id: 'paragraph',
	        label: 'Paragraph',
	        icon: '<svg height="24" width="24" class="type-icon-paragraph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path id="path-1_2_" class="st0" d="M13 5h2v16h2V5h2V3h-6.7.2-3C6.5 3 4 5.5 4 8.5S6.5 14 9.5 14H11v7h2v-7h-.5.5V5z"/><path class="st1" d="M9.5 3C6.5 3 4 5.5 4 8.5S6.5 14 9.5 14H11v7h2V5h2v16h2V5h2V3H9.5z"/></svg>',
	        category: 'common'
	    },
	    {
	        id: 'heading',
	        label: 'Heading',
	        icon: '<svg height="24" width="24" class="type-icon-heading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Heading</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M18 20h-3v-6H9v6H6V5.01h3V11h6V5.01h3V20z"/></g></svg>',
	        category: 'common'
	    },
	    {
	        id: 'image',
	        label: 'Image',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.25 1h15.5c0.69 0 1.25 0.56 1.25 1.25v15.5c0 0.69-0.56 1.25-1.25 1.25h-15.5c-0.69 0-1.25-0.56-1.25-1.25v-15.5c0-0.69 0.56-1.25 1.25-1.25zM17 17v-14h-14v14h14zM10 6c0-1.1-0.9-2-2-2s-2 0.9-2 2 0.9 2 2 2 2-0.9 2-2zM13 11c0 0 0-6 3-6v10c0 0.55-0.45 1-1 1h-10c-0.55 0-1-0.45-1-1v-7c2 0 3 4 3 4s1-3 3-3 3 2 3 2z"></path></svg>',
	        category: 'common'
	    },
	    {
	        id: 'quote',
	        label: 'Quote',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8.54 12.74c0-0.87-0.24-1.61-0.72-2.22-0.73-0.92-2.14-1.030-2.96-0.85-0.34-1.93 1.3-4.39 3.42-5.45l-1.63-2.28c-3.2 1.52-6.34 5.020-5.8 9.43 0.34 2.79 1.95 4.63 4.23 4.63 1 0 1.83-0.29 2.48-0.88 0.66-0.59 0.98-1.38 0.98-2.38zM17.97 12.74c0-0.87-0.24-1.61-0.72-2.22-0.73-0.92-2.14-1.030-2.96-0.85-0.34-1.93 1.3-4.39 3.42-5.45l-1.63-2.28c-3.2 1.52-6.34 5.020-5.8 9.43 0.34 2.79 1.95 4.63 4.23 4.63 1 0 1.83-0.29 2.48-0.88 0.66-0.59 0.98-1.38 0.98-2.38z"></path></svg>',
	        category: 'common'
	    },
	    {
	        id: 'gallery',
	        label: 'Gallery',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16 4h1.96c0.57 0 1.040 0.47 1.040 1.040v12.92c0 0.57-0.47 1.040-1.040 1.040h-12.92c-0.57 0-1.040-0.47-1.040-1.040v-1.96h-1.96c-0.57 0-1.040-0.47-1.040-1.040v-12.92c0-0.57 0.47-1.040 1.040-1.040h12.92c0.57 0 1.040 0.47 1.040 1.040v1.96zM3 14h11v-11h-11v11zM8 5.5c0-0.83-0.67-1.5-1.5-1.5s-1.5 0.67-1.5 1.5 0.67 1.5 1.5 1.5 1.5-0.67 1.5-1.5zM10 10c0 0 1-5 3-5v8h-9v-6c2 0 2 3 2 3s0.33-2 2-2 2 2 2 2zM17 17v-11h-1v8.96c0 0.57-0.47 1.040-1.040 1.040h-8.96v1h11z"></path></svg>',
	        category: 'media'
	    },
	    {
	        id: 'unordered-list',
	        label: 'Unordered List',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5.5 7c-0.83 0-1.5-0.67-1.5-1.5 0-0.82 0.67-1.5 1.5-1.5 0.82 0 1.5 0.68 1.5 1.5 0 0.83-0.68 1.5-1.5 1.5zM8 5h9v1h-9v-1zM5.5 12c-0.83 0-1.5-0.67-1.5-1.5 0-0.82 0.67-1.5 1.5-1.5 0.82 0 1.5 0.68 1.5 1.5 0 0.83-0.68 1.5-1.5 1.5zM8 10h9v1h-9v-1zM5.5 17c-0.83 0-1.5-0.67-1.5-1.5 0-0.82 0.67-1.5 1.5-1.5 0.82 0 1.5 0.68 1.5 1.5 0 0.83-0.68 1.5-1.5 1.5zM8 15h9v1h-9v-1z"></path></svg>',
	        category: 'common'
	    },
	    {
	        id: 'ordered-list',
	        label: 'Ordered List',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 7v-4h-0.69l-1.29 1.030 0.4 0.51 0.46-0.37c0.060-0.050 0.16-0.14 0.3-0.28l-0.020 0.42v2.69h0.84zM8 5h9v1h-9v-1zM6.77 11.95v-0.7h-1.72v-0.040l0.51-0.48c0.33-0.31 0.57-0.54 0.7-0.71 0.14-0.17 0.24-0.33 0.3-0.49 0.070-0.16 0.1-0.33 0.1-0.51 0-0.21-0.050-0.4-0.16-0.56-0.1-0.16-0.25-0.28-0.44-0.37s-0.41-0.14-0.65-0.14c-0.19 0-0.36 0.020-0.51 0.060-0.15 0.030-0.29 0.090-0.42 0.15-0.12 0.070-0.29 0.19-0.48 0.35l0.45 0.54c0.16-0.13 0.31-0.23 0.45-0.3 0.15-0.070 0.3-0.1 0.45-0.1 0.14 0 0.26 0.030 0.35 0.11s0.13 0.2 0.13 0.36c0 0.1-0.020 0.2-0.060 0.3s-0.1 0.21-0.19 0.33c-0.090 0.11-0.29 0.32-0.58 0.62l-0.99 1v0.58h2.76zM8 10h9v1h-9v-1zM6.71 13.95c0-0.3-0.12-0.54-0.37-0.71-0.24-0.17-0.58-0.26-1-0.26-0.52 0-0.96 0.13-1.33 0.4l0.4 0.6c0.17-0.11 0.32-0.19 0.46-0.23 0.14-0.050 0.27-0.070 0.41-0.070 0.38 0 0.58 0.15 0.58 0.46 0 0.2-0.070 0.35-0.22 0.43s-0.38 0.12-0.7 0.12h-0.31v0.66h0.31c0.34 0 0.59 0.040 0.75 0.12 0.15 0.080 0.23 0.22 0.23 0.41 0 0.22-0.070 0.37-0.2 0.47-0.14 0.1-0.35 0.15-0.63 0.15-0.19 0-0.38-0.030-0.57-0.080s-0.36-0.12-0.52-0.2v0.74c0.34 0.15 0.74 0.22 1.18 0.22 0.53 0 0.94-0.11 1.22-0.33 0.29-0.22 0.43-0.52 0.43-0.92 0-0.27-0.090-0.48-0.26-0.64s-0.42-0.26-0.74-0.3v-0.020c0.27-0.060 0.49-0.19 0.65-0.37 0.15-0.18 0.23-0.39 0.23-0.65zM8 15h9v1h-9v-1z"></path></svg>',
	        category: 'common'
	    },
	    {
	        id: 'embed',
	        label: 'Embed',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 13v-6c0-1.1-0.9-2-2-2h-7c-1.1 0-2 0.9-2 2v6c0 1.1 0.9 2 2 2h7c1.1 0 2-0.9 2-2zM13 10.5l6 4.5v-10l-6 4.5v1z"></path></svg>',
	        category: 'embeds'
	    },
	    {
	        id: 'separator',
	        label: 'Separator',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Minus Small</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M6 11h12v2H6z"/></g></svg>',
	        category: 'common'
	    },
	    {
	        id: 'map',
	        label: 'Map',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13 13.14l1.17-5.94c0.79-0.43 1.33-1.25 1.33-2.2 0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5c0 0.95 0.54 1.77 1.33 2.2zM13 3.5c0.83 0 1.5 0.67 1.5 1.5s-0.67 1.5-1.5 1.5-1.5-0.67-1.5-1.5 0.67-1.5 1.5-1.5zM14.72 8.3l3.28-1.33v9l-4.88 2.030-6.12-2.030-5 2v-9l5-2 4.27 1.41 1.73 7.3z"></path></svg>',
	        category: 'embeds'
	    },
	    {
	        id: 'google-map',
	        label: 'Google Map',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13 13.14l1.17-5.94c0.79-0.43 1.33-1.25 1.33-2.2 0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5c0 0.95 0.54 1.77 1.33 2.2zM13 3.5c0.83 0 1.5 0.67 1.5 1.5s-0.67 1.5-1.5 1.5-1.5-0.67-1.5-1.5 0.67-1.5 1.5-1.5zM14.72 8.3l3.28-1.33v9l-4.88 2.030-6.12-2.030-5 2v-9l5-2 4.27 1.41 1.73 7.3z"></path></svg>',
	        category: 'other'
	    },
	    {
	        id: 'openstreet-map',
	        label: 'OpenStreet Map',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13 13.14l1.17-5.94c0.79-0.43 1.33-1.25 1.33-2.2 0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5c0 0.95 0.54 1.77 1.33 2.2zM13 3.5c0.83 0 1.5 0.67 1.5 1.5s-0.67 1.5-1.5 1.5-1.5-0.67-1.5-1.5 0.67-1.5 1.5-1.5zM14.72 8.3l3.28-1.33v9l-4.88 2.030-6.12-2.030-5 2v-9l5-2 4.27 1.41 1.73 7.3z"></path></svg>',
	        category: 'other'
	    },
	    {
	        id: 'tweet',
	        label: 'Tweet',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M22.23 5.924c-.736.326-1.527.547-2.357.646.847-.508 1.498-1.312 1.804-2.27-.793.47-1.67.812-2.606.996C18.325 4.498 17.258 4 16.078 4c-2.266 0-4.103 1.837-4.103 4.103 0 .322.036.635.106.935-3.41-.17-6.433-1.804-8.457-4.287-.353.607-.556 1.312-.556 2.064 0 1.424.724 2.68 1.825 3.415-.673-.022-1.305-.207-1.86-.514v.052c0 1.988 1.415 3.647 3.293 4.023-.344.095-.707.145-1.08.145-.265 0-.522-.026-.773-.074.522 1.63 2.038 2.817 3.833 2.85-1.404 1.1-3.174 1.757-5.096 1.757-.332 0-.66-.02-.98-.057 1.816 1.164 3.973 1.843 6.29 1.843 7.547 0 11.675-6.252 11.675-11.675 0-.178-.004-.355-.012-.53.802-.578 1.497-1.3 2.047-2.124z"/></g></svg>',
	        category: 'other'
	    },
	    {
	        id: 'video',
	        label: 'Video',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 13v-6c0-1.1-0.9-2-2-2h-7c-1.1 0-2 0.9-2 2v6c0 1.1 0.9 2 2 2h7c1.1 0 2-0.9 2-2zM13 10.5l6 4.5v-10l-6 4.5v1z"></path></svg>',
	        category: 'media'
	    },
	    {
	        id: 'youtube',
	        label: 'YouTube',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M21.8 8s-.195-1.377-.795-1.984c-.76-.797-1.613-.8-2.004-.847-2.798-.203-6.996-.203-6.996-.203h-.01s-4.197 0-6.996.202c-.39.046-1.242.05-2.003.846C2.395 6.623 2.2 8 2.2 8S2 9.62 2 11.24v1.517c0 1.618.2 3.237.2 3.237s.195 1.378.795 1.985c.76.797 1.76.77 2.205.855 1.6.153 6.8.2 6.8.2s4.203-.005 7-.208c.392-.047 1.244-.05 2.005-.847.6-.607.795-1.985.795-1.985s.2-1.618.2-3.237v-1.517C22 9.62 21.8 8 21.8 8zM9.935 14.595v-5.62l5.403 2.82-5.403 2.8z"/></g></svg>',
	        category: 'media'
	    },
	    {
	        id: 'vimeo',
	        label: 'Vimeo',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M22.396 7.164c-.093 2.026-1.507 4.8-4.245 8.32C15.323 19.16 12.93 21 10.97 21c-1.214 0-2.24-1.12-3.08-3.36-.56-2.052-1.118-4.105-1.68-6.158-.622-2.24-1.29-3.36-2.004-3.36-.156 0-.7.328-1.634.98l-.978-1.26c1.027-.903 2.04-1.806 3.037-2.71C6 3.95 7.03 3.328 7.716 3.265c1.62-.156 2.616.95 2.99 3.32.404 2.558.685 4.148.84 4.77.468 2.12.982 3.18 1.543 3.18.435 0 1.09-.687 1.963-2.064.872-1.376 1.34-2.422 1.402-3.142.125-1.187-.343-1.782-1.4-1.782-.5 0-1.013.115-1.542.34 1.023-3.35 2.977-4.976 5.862-4.883 2.14.063 3.148 1.45 3.024 4.16z"/></g></svg>',
	        category: 'media'
	    },
	    {
	        id: 'audio',
	        label: 'Audio',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Audio</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M8 4v10.184C7.686 14.072 7.353 14 7 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7h7v4.184c-.314-.112-.647-.184-1-.184-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4H8z"/></g></svg>',
	        category: 'media'
	    },
	    {
	        id: 'form',
	        label: 'Form',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2 2h7v7h-7v-7zM11 2v7h7v-7h-7zM5.5 4.5l1.5-1.5h-3zM12 8v-5h5v5h-5zM4.5 5.5l-1.5-1.5v3zM8 4l-1.5 1.5 1.5 1.5v-3zM5.5 6.5l-1.5 1.5h3zM9 18v-7h-7v7h7zM18 18h-7v-7h7v7zM8 12v5h-5v-5h5zM14.5 13.5l1.5-1.5h-3zM12 16l1.5-1.5-1.5-1.5v3zM15.5 14.5l1.5 1.5v-3zM14.5 15.5l-1.5 1.5h3z"></path></svg>',
	        category: 'other'
	    },
	    {
	        id: 'survey',
	        label: 'Survey',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Custom Post Type</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zM6 6h5v5H6V6zm4.5 13C9.12 19 8 17.88 8 16.5S9.12 14 10.5 14s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm3-6l3-5 3 5h-6z"/></g></svg>',
	        category: 'other'
	    },
	    {
	        id: 'toc',
	        label: 'Table of Contents',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2 19h16c0.55 0 1-0.45 1-1v-16c0-0.55-0.45-1-1-1h-16c-0.55 0-1 0.45-1 1v16c0 0.55 0.45 1 1 1zM4 3c0.55 0 1 0.45 1 1s-0.45 1-1 1-1-0.45-1-1 0.45-1 1-1zM17 3v2h-11v-2h11zM4 7c0.55 0 1 0.45 1 1s-0.45 1-1 1-1-0.45-1-1 0.45-1 1-1zM17 7v2h-11v-2h11zM4 11c0.55 0 1 0.45 1 1s-0.45 1-1 1-1-0.45-1-1 0.45-1 1-1zM17 11v2h-11v-2h11zM4 15c0.55 0 1 0.45 1 1s-0.45 1-1 1-1-0.45-1-1 0.45-1 1-1zM17 15v2h-11v-2h11z"></path></svg>',
	        category: 'layout'
	    },
	    {
	        id: 'wordpress-post',
	        label: 'WordPress Post',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>My Sites</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM3.5 12c0-1.232.264-2.402.736-3.46L8.29 19.65C5.456 18.272 3.5 15.365 3.5 12zm8.5 8.5c-.834 0-1.64-.12-2.4-.345l2.55-7.41 2.613 7.157c.017.042.038.08.06.117-.884.31-1.833.48-2.823.48zm1.172-12.485c.512-.027.973-.08.973-.08.458-.055.404-.728-.054-.702 0 0-1.376.108-2.265.108-.835 0-2.24-.107-2.24-.107-.458-.026-.51.674-.053.7 0 0 .434.055.892.082l1.324 3.63-1.86 5.578-3.096-9.208c.512-.027.973-.08.973-.08.458-.055.403-.728-.055-.702 0 0-1.376.108-2.265.108-.16 0-.347-.003-.547-.01C6.418 5.025 9.03 3.5 12 3.5c2.213 0 4.228.846 5.74 2.232-.037-.002-.072-.007-.11-.007-.835 0-1.427.727-1.427 1.51 0 .7.404 1.292.835 1.993.323.566.7 1.293.7 2.344 0 .727-.28 1.572-.646 2.748l-.848 2.833-3.072-9.138zm3.1 11.332l2.597-7.506c.484-1.212.645-2.18.645-3.044 0-.313-.02-.603-.057-.874.664 1.21 1.042 2.6 1.042 4.078 0 3.136-1.7 5.874-4.227 7.347z"/></g></svg>',
	        category: 'other'
	    },
	    {
	        id: 'facebook-post',
	        label: 'Facebook Post',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M20.007 3H3.993C3.445 3 3 3.445 3 3.993v16.013c0 .55.445.994.993.994h8.62v-6.97H10.27V11.31h2.346V9.31c0-2.325 1.42-3.59 3.494-3.59.993 0 1.847.073 2.096.106v2.43h-1.438c-1.128 0-1.346.537-1.346 1.324v1.734h2.69l-.35 2.717h-2.34V21h4.587c.548 0 .993-.445.993-.993V3.993c0-.548-.445-.993-.993-.993z"/></g></svg>',
	        category: 'other'
	    },
	    {
	        id: 'opengraph-link',
	        label: 'OpenGraph Link',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M17.74 2.76c1.68 1.69 1.68 4.41 0 6.1l-1.53 1.52c-1.12 1.12-2.7 1.47-4.14 1.090l2.62-2.61 0.76-0.77 0.76-0.76c0.84-0.84 0.84-2.2 0-3.040-0.84-0.85-2.2-0.85-3.040 0l-0.77 0.76-3.38 3.38c-0.37-1.44-0.020-3.020 1.1-4.14l1.52-1.53c1.69-1.68 4.42-1.68 6.1 0zM8.59 13.43l5.34-5.34c0.42-0.42 0.42-1.1 0-1.52-0.44-0.43-1.13-0.39-1.53 0l-5.33 5.34c-0.42 0.42-0.42 1.1 0 1.52 0.44 0.43 1.13 0.39 1.52 0zM7.83 15.72l4.14-4.15c0.38 1.44 0.030 3.020-1.090 4.14l-1.52 1.53c-1.69 1.68-4.41 1.68-6.1 0-1.68-1.68-1.68-4.42 0-6.1l1.53-1.52c1.12-1.12 2.7-1.47 4.14-1.1l-4.14 4.15c-0.85 0.84-0.85 2.2 0 3.050 0.84 0.84 2.2 0.84 3.040 0z"></path></svg>',
	        category: 'other'
	    },
	    {
	        id: 'playlist',
	        label: 'Playlist',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Audio</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M8 4v10.184C7.686 14.072 7.353 14 7 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7h7v4.184c-.314-.112-.647-.184-1-.184-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4H8z"/></g></svg>',
	        category: 'media'
	    },
	    {
	        id: 'spotify-playlist',
	        label: 'Spotify Playlist',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.808-.87 7.076-.496 9.712 1.115.293.18.386.563.206.857M17.81 13.7c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.13-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.256 1.072m.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.13-1.166-.624-.148-.495.13-1.017.625-1.167 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.282.325"/></g></svg>',
	        category: 'media'
	    },
	    {
	        id: 'poet',
	        label: 'Poet',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Pencil</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M13 6l5 5-9.507 9.507c-.686-.686-.69-1.794-.012-2.485l-.002-.003c-.69.676-1.8.673-2.485-.013-.677-.677-.686-1.762-.036-2.455l-.008-.008c-.694.65-1.78.64-2.456-.036L13 6zm7.586-.414l-2.172-2.172c-.78-.78-2.047-.78-2.828 0L14 5l5 5 1.586-1.586c.78-.78.78-2.047 0-2.828zM3 18v3h3c0-1.657-1.343-3-3-3z"/></g></svg>',
	        category: 'layout'
	    },
	    {
	        id: 'custom-field',
	        label: 'Custom Field',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Layout Blocks</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M21 7h-2V3c0-1.105-.895-2-2-2H7c-1.105 0-2 .895-2 2v2H3c-1.105 0-2 .895-2 2v4c0 1.105.895 2 2 2h2v8c0 1.105.895 2 2 2h10c1.105 0 2-.895 2-2v-2h2c1.105 0 2-.895 2-2V9c0-1.105-.895-2-2-2zm-4 14H7v-8h2c1.105 0 2-.895 2-2V7c0-1.105-.895-2-2-2H7V3h10v4h-2c-1.105 0-2 .895-2 2v8c0 1.105.895 2 2 2h2v2zm4-4h-6V9h6v8z"/></g></svg>',
	        category: 'layout'
	    },
	    {
	        id: 'gist',
	        label: 'Gist',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Code</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M4.83 12l4.58 4.59L8 18l-6-6 6-6 1.41 1.41L4.83 12zm9.76 4.59L16 18l6-6-6-6-1.41 1.41L19.17 12l-4.58 4.59z"/></g></svg>',
	        category: 'other'
	    }
	]
};

var editor = queryFirst( '.editor' );
var switcher = queryFirst( '.block-switcher' );
var switcherButtons = query( '.block-switcher .type svg' );
var switcherMenu = queryFirst( '.switch-block__menu' );
var dockedControls = queryFirst( '.docked-controls' );
var insertBlockButton = queryFirst( '.insert-block__button' );
var insertBlockMenu = queryFirst( '.insert-block__menu' );
var insertBlockMenuSearchInput = queryFirst( '.insert-block__search' );
var insertBlockMenuContent = queryFirst( '.insert-block__content' )
var textAlignLeft = queryFirst( '.block-text__align-left' );
var textAlignCenter = queryFirst( '.block-text__align-center' );
var textAlignRight = queryFirst( '.block-text__align-right' );
var imageFullBleed = queryFirst( '.block-image__full-width' );
var imageAlignNone = queryFirst( '.block-image__no-align' );
var imageAlignLeft = queryFirst( '.block-image__align-left' );
var imageAlignRight = queryFirst( '.block-image__align-right' );

// Contants
var KEY_ENTER = 13;
var KEY_ARROW_LEFT = 37;
var KEY_ARROW_UP = 38;
var KEY_ARROW_RIGHT = 39;
var KEY_ARROW_DOWN = 40;

// Editor Variables
var selectedBlock = null;

// Block Menu Variables
var previouslyFocusedBlock = null;
var searchBlockFilter = '';
var blockMenuOpened = false;
var menuSelectedBlock = null;

// Helper variables
var orderedBlocks = config.blockCategories.reduce( function( memo, category ) {
	var categoryBlocks = config.blocks.filter( function( block ) {
		return block.category === category.id;
	} );

	return memo.concat( categoryBlocks );
}, [] );

var supportedBlockTags = Object.keys( config.tagTypes )
	.slice( 0, -1 ) // remove 'default' option
	.map( function( tag ) { return tag.toLowerCase(); } );

/**
 * Initialization
 */
window.addEventListener( 'click', clearBlocks, false );
editor.addEventListener( 'input', attachBlockHandlers, false );
editor.addEventListener( 'input', clearBlocks, false );
insertBlockButton.addEventListener( 'click', openBlockMenu, false );
insertBlockMenu.addEventListener( 'click', function( event ) {
	event.stopPropagation();
}, false );

attachBlockHandlers();
attachControlActions();
attachTypeSwitcherActions();
attachBlockMenuSearch();
attachKeyboardShortcuts();

/**
 * Core logic
 */
function attachBlockHandlers() {
	getBlocks().forEach( function( block ) {
		block.removeEventListener( 'click', selectBlock, false );
		block.addEventListener( 'click', selectBlock, false );
	} );
}

function getBlocks() {
	return Array.prototype.concat.apply( [],
			supportedBlockTags.map( query ) );
}

function getFocusedBlock() {
	var focusedBlocks = getBlocks().filter( function( block ) {
		return block.contains( window.getSelection().anchorNode );
	} );

	return focusedBlocks.length ? focusedBlocks[ 0 ] : null;
}

function selectBlock( event ) {
	clearBlocks();
	event.stopPropagation();
	event.target.classList.add( 'is-selected' );

	selectedBlock = event.target;
	showControls( selectedBlock );
}

function clearBlocks() {
	getBlocks().forEach( function( block ) {
		block.classList.remove( 'is-selected' );
	} );
	selectedBlock = null;

	hideControls();
	hideMenu();
}

function showControls( node ) {
	// toggle block-specific switcher
	switcherButtons.forEach( function( element ) {
		element.style.display = 'none';
	} );

	var blockType = getTagType( node.nodeName );
	var switcherQuery = '.type-icon-' + blockType;
	queryFirst( switcherQuery ).style.display = 'block';

	// reposition switcher
	var position = node.getBoundingClientRect();
	switcher.style.opacity = 1;
	switcher.style.top = ( position.top + 18 + window.scrollY ) + 'px';

	// show/hide block-specific block controls
	dockedControls.className = 'docked-controls';
	getTypeKinds( blockType ).forEach( function( kind ) {
		dockedControls.classList.add( 'is-' + kind );
	} );
	dockedControls.style.display = 'block';

	// reposition block-specific block controls
	updateDockedControlsPosition();
}

function updateDockedControlsPosition( newClassName ) {
	var isImage = selectedBlock.tagName === 'IMG';
	var className = selectedBlock.className;
	var position = selectedBlock.getBoundingClientRect();
	var alignedRight = className.match( /align-right/ );
	var alignedLeft = className.match( /align-left/ );
	var fullBleed = className.match( /full-bleed/ );

	var topPosition = position.top - 34 + window.scrollY;
	var leftPosition = null;

	if ( isImage && alignedRight ) {
		leftPosition = position.left;
		topPosition = newClassName ? topPosition - 15 : topPosition;
	} else if ( isImage && alignedLeft && newClassName ) {
		topPosition = topPosition - 15;
	} else if ( isImage && className === 'is-selected' && dockedControls.style.left ) {
		leftPosition = null;
		topPosition = topPosition + 15;
	} else if ( fullBleed ) {
		leftPosition = ( window.innerWidth / 2 ) - ( dockedControls.clientWidth / 2 );
	}

	dockedControls.style.maxHeight = 'none';
	dockedControls.style.top = topPosition + 'px';
	dockedControls.style.left = leftPosition ? leftPosition + 'px' : null;
}

function hideControls() {
	switcher.style.opacity = 0;
	switcherMenu.style.display = 'none';
	dockedControls.style.display = 'none';
}

function attachControlActions() {
	Array.from( switcher.childNodes ).forEach( function( node ) {
		if ( 'svg' !== node.nodeName ) {
			return;
		}

		var classes = node.className.baseVal;
		var getter = {
			up: getPreviousSibling,
			down: getNextSibling
		}[ classes ];

		if ( getter ) {
			node.addEventListener( 'click', function( event ) {
				event.stopPropagation();
				var previousOffset = selectedBlock.offsetTop;
				swapNodes( selectedBlock, getter( selectedBlock ) );
				attachBlockHandlers();
				reselect();
				window.scrollTo( window.scrollX, window.scrollY + selectedBlock.offsetTop - previousOffset );
			}, false );
		}
	} );

	// Text block event handlers.
	textAlignLeft.addEventListener( 'click', setTextAlignLeft, false );
	textAlignCenter.addEventListener( 'click', setTextAlignCenter, false );
	textAlignRight.addEventListener( 'click', setTextAlignRight, false );

	switcherButtons.forEach( function( button ) {
		button.addEventListener( 'click', showSwitcherMenu, false );
	} );

	// Image block event handlers.
	imageFullBleed.addEventListener( 'click', setImageFullBleed, false );
	imageAlignNone.addEventListener( 'click', setImageAlignNone, false );
	imageAlignLeft.addEventListener( 'click', setImageAlignLeft, false );
	imageAlignRight.addEventListener( 'click', setImageAlignRight, false );
}

function attachTypeSwitcherActions() {
	var typeToTag = {
		paragraph: 'p',
		quote: 'blockquote',
		heading: 'h2'
	};

	switcherButtons.forEach( function( button ) {
		button.addEventListener( 'click', showSwitcherMenu, false );
	} );

	Object.keys( typeToTag ).forEach( function( type ) {
		var iconSelector = '.switch-block__block .type-icon-' + type;
		var button = queryFirst( iconSelector ).parentNode;
		button.addEventListener( 'click', switchBlockType, false );

		function switchBlockType( event ) {
			if ( ! selectedBlock ) {
				return;
			}

			var openingRe = /^<\w+/;
			var closingRe = /\w+>$/;
			var tag = typeToTag[ type ];
			selectedBlock.outerHTML = selectedBlock.outerHTML
				.replace( openingRe, '<' + tag )
				.replace( closingRe, tag + '>' );
			clearBlocks();
			attachBlockHandlers();
		}
	} );
}

function renderBlockMenu() {
	insertBlockMenuContent.innerHTML = '';
	config.blockCategories.forEach( function ( category ) {
		var node = document.createElement( 'div' );
		node.className = 'insert-block__category category_' + category.id;
		var nodeHeader = document.createElement( 'span' );
		nodeHeader.className = 'insert-block__separator';
		nodeHeader.innerText = category.label;
		var nodeBlocks = document.createElement( 'div' );
		nodeBlocks.className = 'insert_block__category-blocks';
		node.appendChild( nodeHeader );
		node.appendChild( nodeBlocks );
		var categoryBlocks = config.blocks
			.filter( function( block ) {
				return block.category === category.id
					&& block.label.toLowerCase().indexOf( searchBlockFilter.toLowerCase() ) !== -1;
			} );
		categoryBlocks
			.forEach( function( block ) {
				var node = document.createElement( 'div' );
				node.className = 'insert-block__block block-' + block.id + ( menuSelectedBlock === block ? ' is-active' : '' );
				node.innerHTML = block.icon + ' ' + block.label;
				nodeBlocks.appendChild(node);
			} );

		if ( categoryBlocks.length ) {
			insertBlockMenuContent.appendChild( node );
		}
	} );
}

function attachBlockMenuSearch() {
	insertBlockMenuSearchInput.addEventListener( 'keyup', filterBlockMenu, false );
	insertBlockMenuSearchInput.addEventListener( 'input', filterBlockMenu, false );
	insertBlockMenuContent.addEventListener( 'scroll', handleBlockMenuScroll, false );
	selectBlockInMenu();
	renderBlockMenu();

	function filterBlockMenu( event ) {
		searchBlockFilter = event.target.value;
		selectBlockInMenu();
		renderBlockMenu();
	}

	function handleBlockMenuScroll( event ) {
		if ( insertBlockMenuContent.scrollHeight - insertBlockMenuContent.scrollTop <= insertBlockMenuContent.clientHeight ) {
			insertBlockMenuContent.className = 'insert-block__content is-bottom';
		} else {
			insertBlockMenuContent.className = 'insert-block__content';
		}
	}
}

/**
 * Select a block in the block menu
 * @param direction direction from the current position (up/down/left/right)
 */
function selectBlockInMenu( direction ) {
	var filteredBlocks = orderedBlocks.filter( function( block ) {
		return block.label.toLowerCase().indexOf( searchBlockFilter.toLowerCase() ) !== -1;
	} );
	var countBlocksByCategories = filteredBlocks.reduce( function( memo, block ) {
		if ( ! memo[ block.category ] ) {
			memo[ block.category ] = 0;
		}
		memo[ block.category ]++;
		return memo;
	}, {} );

	var selectedBlockIndex = filteredBlocks.indexOf( menuSelectedBlock );
	selectedBlockIndex = selectedBlockIndex === -1 ? 0 : selectedBlockIndex;
	var currentBlock = filteredBlocks[ selectedBlockIndex ];
	var previousBlock = filteredBlocks[ selectedBlockIndex - 1 ];
	var nextBlock = filteredBlocks[ selectedBlockIndex + 1 ];
	var offset = 0;
	switch ( direction ) {
		case KEY_ARROW_UP:
			offset = (
				currentBlock
				&& filteredBlocks[ selectedBlockIndex - 2 ]
				&& (
					filteredBlocks[ selectedBlockIndex - 2 ].category === currentBlock.category
					|| countBlocksByCategories[ previousBlock.category ] % 2 === 0
				)
			) ? -2 : -1;
			break;
		case KEY_ARROW_DOWN:
			offset = (
				currentBlock
				&& filteredBlocks[ selectedBlockIndex + 2 ]
				&& (
					currentBlock.category === filteredBlocks[ selectedBlockIndex + 2 ].category
					|| filteredBlocks[ selectedBlockIndex + 2 ].category === nextBlock.category
					|| nextBlock.category === currentBlock.category
				)
			) ? 2 : 1;
			break;
		case KEY_ARROW_RIGHT:
			offset = 1;
			break;
		case KEY_ARROW_LEFT:
			offset = -1;
			break;
	}

	menuSelectedBlock = filteredBlocks[ selectedBlockIndex + offset ] || menuSelectedBlock;

	// Hack to wait for the rerender before scrolling
	setTimeout( function() {
		var blockElement = queryFirst( '.insert-block__block.block-' + menuSelectedBlock.id );
		if (
			blockElement && (
				blockElement.offsetTop + blockElement.offsetHeight > insertBlockMenuContent.clientHeight + insertBlockMenuContent.scrollTop
				|| blockElement.offsetTop < insertBlockMenuContent.scrollTop
			)
		) {
			insertBlockMenuContent.scrollTop = blockElement.offsetTop - 23;
		}
	} );
}

function attachKeyboardShortcuts() {
	document.addEventListener( 'keypress', handleKeyPress, false );
	document.addEventListener( 'keydown', handleKeyDown, false );

	function handleKeyPress( event ) {
		if ( '/' === String.fromCharCode( event.keyCode ) && ! blockMenuOpened ) {
			var focusedBlock = getFocusedBlock();
			if ( document.activeElement !== editor || ( focusedBlock && ! focusedBlock.textContent ) ) {
				event.preventDefault();
				openBlockMenu();
			}
		}
	}

	function handleKeyDown( event ) {
		if ( ! blockMenuOpened ) return;
		switch ( event.keyCode  ) {
			case KEY_ENTER:
				event.preventDefault();
				hideMenu();
				break;
			case KEY_ARROW_DOWN:
			case KEY_ARROW_UP:
			case KEY_ARROW_LEFT:
			case KEY_ARROW_RIGHT:
				event.preventDefault();
				selectBlockInMenu( event.keyCode );
				renderBlockMenu();
				break;
		}
	}
}

function reselect() {
	queryFirst( '.is-selected' ).click();
}

function swapNodes( a, b ) {
	if ( ! ( a && b ) ) {
		return false;
	}

	var parent = a.parentNode;
	if ( ! parent ) {
		return false;
	}

	// insert node copies before removal
	parent.replaceChild( b.cloneNode( true ), a );
	parent.replaceChild( a.cloneNode( true ), b );

	return true;
}

/**
 * Utility functions
 */
function siblingGetter( direction ) {
	var sibling = direction + 'Sibling';

	return function getAdjacentSibling( node ) {
		if ( null === node ) {
			return null;
		}

		if ( null === node[ sibling ] ) {
			return null;
		}

		if ( '#text' === node[ sibling ].nodeName ) {
			return getAdjacentSibling( node[ sibling ] );
		}

		return node[ sibling ];
	}
}

function openBlockMenu( event ) {
	clearBlocks();
	event && event.stopPropagation();
	insertBlockMenu.style.display = 'block';
	blockMenuOpened = true;
	searchBlockFilter = '';
	insertBlockMenuSearchInput.value = '';
	menuSelectedBlock = false;
	previouslyFocusedBlock = getFocusedBlock();
	insertBlockMenuSearchInput.focus();
	selectBlockInMenu();
	renderBlockMenu();
}

function hideMenu() {
	if ( ! blockMenuOpened ) return;
	insertBlockMenu.style.display = 'none';
	blockMenuOpened = false;
	if ( previouslyFocusedBlock ) {
		setCaret( previouslyFocusedBlock );
	}
}

function showSwitcherMenu( event ) {
	event.stopPropagation();

	if ( ! selectedBlock ) {
		return;
	}

	// not all block types can be converted to all block types.
	// filter which lists of types are shown in the menu depending on the
	// selected block, based on _kinds_ (see config)
	var blockType = getTagType( selectedBlock.nodeName );
	var kinds = getTypeKinds( blockType );
	var validClasses = kinds.map( function( kind ) {
		return 'switch-block__block-list-' + kind;
	} );
	query( '.switch-block__block-list' ).forEach( function( switcherGroup ) {
		var shouldShow = containsOneOf( switcherGroup, validClasses );
		switcherGroup.style.display = shouldShow ? 'block' : 'none';
	} );

	// position switcher menu next to type icon
	var position = switcher.getBoundingClientRect();
	switcherMenu.style.top = ( position.top + 42 + window.scrollY ) + 'px';
	switcherMenu.style.left = ( position.left - 32 + window.scrollX ) + 'px';
	switcherMenu.style.display = 'block';
}

function setElementState( className, event ) {
	event.stopPropagation();
	selectedBlock.className = 'is-selected';
	if ( className ) {
		selectedBlock.classList.add( className );
	}
	updateDockedControlsPosition( className );
}

function setCaret( element ) {
	var range = document.createRange();
	range.setStart( element.childNodes[0] ,0 );
	range.collapse( true );
	var selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange( range );
}

function l( data ) {
	console.log.apply( console.log, arguments );
	return data;
}

function query( selector ) {
	return Array.from( document.querySelectorAll( selector ) );
}

function queryFirst( selector ) {
	return query( selector )[ 0 ];
}

function getConfig( configName, tagName ) {
	return config[ configName ][ tagName ] ||
		config[ configName ].default;
}

function containsOneOf( element, classes ) {
	return classes.some( function( className ) {
		return element.classList.contains( className );
	} );
}
