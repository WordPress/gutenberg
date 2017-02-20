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
	        icon: '<svg width="24" height="24" class="type-icon-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Image</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M13 9.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5zM22 6v12c0 1.105-.895 2-2 2H4c-1.105 0-2-.895-2-2V6c0-1.105.895-2 2-2h16c1.105 0 2 .895 2 2zm-2 0H4v7.444L8 9l5.895 6.55 1.587-1.85c.798-.932 2.24-.932 3.037 0L20 15.426V6z"/></g></svg>',
	        category: 'common'
	    },
	    {
	        id: 'quote',
	        label: 'Quote',
	        icon: '<svg class="gridicon gridicons-quote" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.003zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.817-.56-.124-1.074-.13-1.54-.022-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.49 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.165 1.4.615 2.52 1.35 3.35.732.833 1.646 1.25 2.742 1.25.967 0 1.768-.29 2.402-.876.627-.576.942-1.365.942-2.368v.01z"></path></g></svg>',
	        category: 'common'
	    },
	    {
	        id: 'gallery',
	        label: 'Gallery',
	        icon: '<svg class="gridicon gridicons-image-multiple" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M15 7.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5S17.328 9 16.5 9 15 8.328 15 7.5zM4 20h14c0 1.105-.895 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.105.895-2 2-2v14zM22 4v12c0 1.105-.895 2-2 2H8c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2zM8 4v6.333L11 7l4.855 5.395.656-.73c.796-.886 2.183-.886 2.977 0l.513.57V4H8z"></path></g></svg>',
	        category: 'media'
	    },
	    {
	        id: 'unordered-list',
	        label: 'Unordered List',
	        icon: '<svg class="gridicon gridicons-list-unordered" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M9 19h12v-2H9v2zm0-6h12v-2H9v2zm0-8v2h12V5H9zm-4-.5c-.828 0-1.5.672-1.5 1.5S4.172 7.5 5 7.5 6.5 6.828 6.5 6 5.828 4.5 5 4.5zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5z"></path></g></svg>',
	        category: 'common'
	    },
	    {
	        id: 'ordered-list',
	        label: 'Ordered List',
	        icon: '<svg class="gridicon gridicons-list-ordered" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M8 19h13v-2H8v2zm0-6h13v-2H8v2zm0-8v2h13V5H8zm-4.425.252c.107-.096.197-.188.27-.275-.013.228-.02.48-.02.756V8h1.176V3.717H3.96L2.487 4.915l.6.738.487-.4zm.334 7.764c.474-.426.784-.715.93-.867.145-.153.26-.298.35-.436.087-.138.152-.278.194-.42.042-.143.063-.298.063-.466 0-.225-.06-.427-.18-.608s-.29-.32-.507-.417c-.218-.1-.465-.148-.742-.148-.22 0-.42.022-.596.067s-.34.11-.49.195c-.15.085-.337.226-.558.423l.636.744c.174-.15.33-.264.467-.34.138-.078.274-.117.41-.117.13 0 .232.032.304.097.073.064.11.152.11.264 0 .09-.02.176-.055.258-.036.082-.1.18-.192.294-.092.114-.287.328-.586.64L2.42 13.238V14h3.11v-.955H3.91v-.03zm.53 4.746v-.018c.306-.086.54-.225.702-.414.162-.19.243-.42.243-.685 0-.31-.126-.55-.378-.727-.252-.176-.6-.264-1.043-.264-.307 0-.58.033-.816.1s-.47.178-.696.334l.48.773c.293-.183.576-.274.85-.274.147 0 .263.027.35.082s.13.14.13.252c0 .3-.294.45-.882.45h-.27v.87h.264c.217 0 .393.017.527.05.136.03.233.08.294.143.06.064.09.154.09.27 0 .153-.057.265-.173.337-.115.07-.3.106-.554.106-.164 0-.343-.022-.538-.07-.194-.044-.385-.115-.573-.21v.96c.228.088.44.148.637.182.196.033.41.05.64.05.56 0 .998-.114 1.314-.343.315-.228.473-.542.473-.94.002-.585-.356-.923-1.07-1.013z"></path></g></svg>',
	        category: 'common'
	    },
	    {
	        id: 'embed',
	        label: 'Embed',
	        icon: '<svg class="gridicon gridicons-video" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M20 4v2h-2V4H6v2H4V4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2v-2h2v2h12v-2h2v2c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zM6 16H4v-3h2v3zm0-5H4V8h2v3zm4 4V9l4.5 3-4.5 3zm10 1h-2v-3h2v3zm0-5h-2V8h2v3z"></path></g></svg>',
	        category: 'embeds'
	    },
	    {
	        id: 'separator',
	        label: 'Separator',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Minus Small</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M6 11h12v2H6z"/></g></svg>',
	        categories: 'common'
	    },
	    {
	        id: 'map',
	        label: 'Map',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Custom Post Type</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zM6 6h5v5H6V6zm4.5 13C9.12 19 8 17.88 8 16.5S9.12 14 10.5 14s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm3-6l3-5 3 5h-6z"/></g></svg>',
	        categories: 'embeds'
	    },
	    {
	        id: 'google-map',
	        label: 'Google Map',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Custom Post Type</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zM6 6h5v5H6V6zm4.5 13C9.12 19 8 17.88 8 16.5S9.12 14 10.5 14s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm3-6l3-5 3 5h-6z"/></g></svg>',
	        categories: 'other'
	    },
	    {
	        id: 'openstreet-map',
	        label: 'OpenStreet Map',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Custom Post Type</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zM6 6h5v5H6V6zm4.5 13C9.12 19 8 17.88 8 16.5S9.12 14 10.5 14s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm3-6l3-5 3 5h-6z"/></g></svg>',
	        categories: 'other'
	    },
	    {
	        id: 'tweet',
	        label: 'Tweet',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M22.23 5.924c-.736.326-1.527.547-2.357.646.847-.508 1.498-1.312 1.804-2.27-.793.47-1.67.812-2.606.996C18.325 4.498 17.258 4 16.078 4c-2.266 0-4.103 1.837-4.103 4.103 0 .322.036.635.106.935-3.41-.17-6.433-1.804-8.457-4.287-.353.607-.556 1.312-.556 2.064 0 1.424.724 2.68 1.825 3.415-.673-.022-1.305-.207-1.86-.514v.052c0 1.988 1.415 3.647 3.293 4.023-.344.095-.707.145-1.08.145-.265 0-.522-.026-.773-.074.522 1.63 2.038 2.817 3.833 2.85-1.404 1.1-3.174 1.757-5.096 1.757-.332 0-.66-.02-.98-.057 1.816 1.164 3.973 1.843 6.29 1.843 7.547 0 11.675-6.252 11.675-11.675 0-.178-.004-.355-.012-.53.802-.578 1.497-1.3 2.047-2.124z"/></g></svg>',
	        categories: 'other'
	    },
	    {
	        id: 'video',
	        label: 'Video',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Video</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M20 4v2h-2V4H6v2H4V4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2v-2h2v2h12v-2h2v2c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zM6 16H4v-3h2v3zm0-5H4V8h2v3zm4 4V9l4.5 3-4.5 3zm10 1h-2v-3h2v3zm0-5h-2V8h2v3z"/></g></svg>',
	        categories: 'media'
	    },
	    {
	        id: 'youtube',
	        label: 'YouTube',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M21.8 8s-.195-1.377-.795-1.984c-.76-.797-1.613-.8-2.004-.847-2.798-.203-6.996-.203-6.996-.203h-.01s-4.197 0-6.996.202c-.39.046-1.242.05-2.003.846C2.395 6.623 2.2 8 2.2 8S2 9.62 2 11.24v1.517c0 1.618.2 3.237.2 3.237s.195 1.378.795 1.985c.76.797 1.76.77 2.205.855 1.6.153 6.8.2 6.8.2s4.203-.005 7-.208c.392-.047 1.244-.05 2.005-.847.6-.607.795-1.985.795-1.985s.2-1.618.2-3.237v-1.517C22 9.62 21.8 8 21.8 8zM9.935 14.595v-5.62l5.403 2.82-5.403 2.8z"/></g></svg>',
	        categories: 'media'
	    },
	    {
	        id: 'vimeo',
	        label: 'Vimeo',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M22.396 7.164c-.093 2.026-1.507 4.8-4.245 8.32C15.323 19.16 12.93 21 10.97 21c-1.214 0-2.24-1.12-3.08-3.36-.56-2.052-1.118-4.105-1.68-6.158-.622-2.24-1.29-3.36-2.004-3.36-.156 0-.7.328-1.634.98l-.978-1.26c1.027-.903 2.04-1.806 3.037-2.71C6 3.95 7.03 3.328 7.716 3.265c1.62-.156 2.616.95 2.99 3.32.404 2.558.685 4.148.84 4.77.468 2.12.982 3.18 1.543 3.18.435 0 1.09-.687 1.963-2.064.872-1.376 1.34-2.422 1.402-3.142.125-1.187-.343-1.782-1.4-1.782-.5 0-1.013.115-1.542.34 1.023-3.35 2.977-4.976 5.862-4.883 2.14.063 3.148 1.45 3.024 4.16z"/></g></svg>',
	        categories: 'media'
	    },
	    {
	        id: 'audio',
	        label: 'Audio',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Audio</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M8 4v10.184C7.686 14.072 7.353 14 7 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7h7v4.184c-.314-.112-.647-.184-1-.184-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4H8z"/></g></svg>',
	        categories: 'media'
	    },
	    {
	        id: 'form',
	        label: 'Form',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Custom Post Type</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zM6 6h5v5H6V6zm4.5 13C9.12 19 8 17.88 8 16.5S9.12 14 10.5 14s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm3-6l3-5 3 5h-6z"/></g></svg>',
	        categories: 'other'
	    },
	    {
	        id: 'survey',
	        label: 'Survey',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Custom Post Type</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zM6 6h5v5H6V6zm4.5 13C9.12 19 8 17.88 8 16.5S9.12 14 10.5 14s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm3-6l3-5 3 5h-6z"/></g></svg>',
	        categories: 'other'
	    },
	    {
	        id: 'toc',
	        label: 'Table of Contents',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Pages</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M16 8H8V6h8v2zm0 2H8v2h8v-2zm4-6v12l-6 6H6c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2zm-2 10V4H6v16h6v-4c0-1.105.895-2 2-2h4z"/></g></svg>',
	        categories: 'layout'
	    },
	    {
	        id: 'wordpress-post',
	        label: 'WordPress Post',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>My Sites</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM3.5 12c0-1.232.264-2.402.736-3.46L8.29 19.65C5.456 18.272 3.5 15.365 3.5 12zm8.5 8.5c-.834 0-1.64-.12-2.4-.345l2.55-7.41 2.613 7.157c.017.042.038.08.06.117-.884.31-1.833.48-2.823.48zm1.172-12.485c.512-.027.973-.08.973-.08.458-.055.404-.728-.054-.702 0 0-1.376.108-2.265.108-.835 0-2.24-.107-2.24-.107-.458-.026-.51.674-.053.7 0 0 .434.055.892.082l1.324 3.63-1.86 5.578-3.096-9.208c.512-.027.973-.08.973-.08.458-.055.403-.728-.055-.702 0 0-1.376.108-2.265.108-.16 0-.347-.003-.547-.01C6.418 5.025 9.03 3.5 12 3.5c2.213 0 4.228.846 5.74 2.232-.037-.002-.072-.007-.11-.007-.835 0-1.427.727-1.427 1.51 0 .7.404 1.292.835 1.993.323.566.7 1.293.7 2.344 0 .727-.28 1.572-.646 2.748l-.848 2.833-3.072-9.138zm3.1 11.332l2.597-7.506c.484-1.212.645-2.18.645-3.044 0-.313-.02-.603-.057-.874.664 1.21 1.042 2.6 1.042 4.078 0 3.136-1.7 5.874-4.227 7.347z"/></g></svg>',
	        categories: 'other'
	    },
	    {
	        id: 'facebook-post',
	        label: 'Facebook Post',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M20.007 3H3.993C3.445 3 3 3.445 3 3.993v16.013c0 .55.445.994.993.994h8.62v-6.97H10.27V11.31h2.346V9.31c0-2.325 1.42-3.59 3.494-3.59.993 0 1.847.073 2.096.106v2.43h-1.438c-1.128 0-1.346.537-1.346 1.324v1.734h2.69l-.35 2.717h-2.34V21h4.587c.548 0 .993-.445.993-.993V3.993c0-.548-.445-.993-.993-.993z"/></g></svg>',
	        categories: 'other'
	    },
	    {
	        id: 'opengraph-link',
	        label: 'OpenGraph Link',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Link</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M17 13H7v-2h10v2zm1-6h-1c-1.63 0-3.065.792-3.977 2H18c1.103 0 2 .897 2 2v2c0 1.103-.897 2-2 2h-4.977c.913 1.208 2.347 2 3.977 2h1c2.21 0 4-1.79 4-4v-2c0-2.21-1.79-4-4-4zM2 11v2c0 2.21 1.79 4 4 4h1c1.63 0 3.065-.792 3.977-2H6c-1.103 0-2-.897-2-2v-2c0-1.103.897-2 2-2h4.977C10.065 7.792 8.63 7 7 7H6c-2.21 0-4 1.79-4 4z"/></g></svg>',
	        categories: 'other'
	    },
	    {
	        id: 'playlist',
	        label: 'Playlist',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Audio</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M8 4v10.184C7.686 14.072 7.353 14 7 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7h7v4.184c-.314-.112-.647-.184-1-.184-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4H8z"/></g></svg>',
	        categories: 'media'
	    },
	    {
	        id: 'spotify-playlist',
	        label: 'Spotify Playlist',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.808-.87 7.076-.496 9.712 1.115.293.18.386.563.206.857M17.81 13.7c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.13-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.256 1.072m.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.13-1.166-.624-.148-.495.13-1.017.625-1.167 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.282.325"/></g></svg>',
	        categories: 'media'
	    },
	    {
	        id: 'poet',
	        label: 'Poet',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Pencil</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M13 6l5 5-9.507 9.507c-.686-.686-.69-1.794-.012-2.485l-.002-.003c-.69.676-1.8.673-2.485-.013-.677-.677-.686-1.762-.036-2.455l-.008-.008c-.694.65-1.78.64-2.456-.036L13 6zm7.586-.414l-2.172-2.172c-.78-.78-2.047-.78-2.828 0L14 5l5 5 1.586-1.586c.78-.78.78-2.047 0-2.828zM3 18v3h3c0-1.657-1.343-3-3-3z"/></g></svg>',
	        categories: 'layout'
	    },
	    {
	        id: 'custom-field',
	        label: 'Custom Field',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Layout Blocks</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M21 7h-2V3c0-1.105-.895-2-2-2H7c-1.105 0-2 .895-2 2v2H3c-1.105 0-2 .895-2 2v4c0 1.105.895 2 2 2h2v8c0 1.105.895 2 2 2h10c1.105 0 2-.895 2-2v-2h2c1.105 0 2-.895 2-2V9c0-1.105-.895-2-2-2zm-4 14H7v-8h2c1.105 0 2-.895 2-2V7c0-1.105-.895-2-2-2H7V3h10v4h-2c-1.105 0-2 .895-2 2v8c0 1.105.895 2 2 2h2v2zm4-4h-6V9h6v8z"/></g></svg>',
	        categories: 'layout'
	    },
	    {
	        id: 'gist',
	        label: 'Gist',
	        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Code</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M4.83 12l4.58 4.59L8 18l-6-6 6-6 1.41 1.41L4.83 12zm9.76 4.59L16 18l6-6-6-6-1.41 1.41L19.17 12l-4.58 4.59z"/></g></svg>',
	        categories: 'other'
	    }
	]
};

var editor = queryFirst( '.editor' );
var switcher = queryFirst( '.block-switcher' );
var switcherButtons = query( '.block-switcher .type svg' );
var switcherMenu = queryFirst( '.switch-block__menu' );
var blockControls = queryFirst( '.block-controls' );
var inlineControls = queryFirst( '.inline-controls' );
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
window.addEventListener( 'mouseup', onSelectText, false );

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
	blockControls.className = 'block-controls';
	getTypeKinds( blockType ).forEach( function( kind ) {
		blockControls.classList.add( 'is-' + kind );
	} );
	blockControls.style.display = 'block';

	// reposition block-specific block controls
	updateBlockControlsPosition();
}

function updateBlockControlsPosition( newClassName ) {
	var isImage = selectedBlock.tagName === 'IMG';
	var className = selectedBlock.className;
	var position = selectedBlock.getBoundingClientRect();
	var alignedRight = className.match( /align-right/ );
	var alignedLeft = className.match( /align-left/ );
	var fullBleed = className.match( /full-bleed/ );

	var topPosition = position.top - 36 + window.scrollY;
	var leftPosition = null;

	if ( isImage && alignedRight ) {
		leftPosition = position.left;
		topPosition = newClassName ? topPosition - 15 : topPosition;
	} else if ( isImage && alignedLeft && newClassName ) {
		topPosition = topPosition - 15;
	} else if ( isImage && className === 'is-selected' && blockControls.style.left ) {
		leftPosition = null;
		topPosition = topPosition + 15;
	} else if ( fullBleed ) {
		leftPosition = ( window.innerWidth / 2 ) - ( blockControls.clientWidth / 2 );
	}

	blockControls.style.maxHeight = 'none';
	blockControls.style.top = topPosition + 'px';
	blockControls.style.left = leftPosition ? leftPosition + 'px' : null;
}

function hideControls() {
	switcher.style.opacity = 0;
	switcherMenu.style.display = 'none';
	blockControls.style.display = 'none';
}

function hideInlineControls() {
	inlineControls.style.display = 'none';
}

// Show popup on text selection
function onSelectText( event ) {
	event.stopPropagation();
	var txt = "";

	if ( window.getSelection ) {
		txt = window.getSelection();
	} else if ( document.getSelection ) {
		txt = document.getSelection();
	} else if ( document.selection ) {
		txt = document.selection.createRange().text;
	}

	// Show formatting bar
	if ( txt != '' ) {
		inlineControls.style.display = 'block';
		var range = txt.getRangeAt(0);
		var pos = range.getBoundingClientRect();
		var selectCenter = pos.width / 2;
		var controlsCenter = inlineControls.offsetWidth / 2;
		inlineControls.style.left = ( pos.left + selectCenter - controlsCenter ) + 'px';
		inlineControls.style.top = ( pos.top - 48 + window.scrollY ) + 'px';
	} else {
		inlineControls.style.display = 'none';
	}
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
				swapNodes( selectedBlock, getter( selectedBlock ) );
				attachBlockHandlers();
				reselect();
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
		var selector = '.switch-block__block .type-icon-' + type;
		var button = queryFirst( selector );
		var label = queryFirst( selector + ' + label' );

		button.addEventListener( 'click', switchBlockType, false );
		label.addEventListener( 'click', switchBlockType, false );

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

	var placeholder = document.createElement('div');
	placeholder.className = 'insert-block__separator';
	placeholder.textContent = 'These don\'t work yet.';
	insertBlockMenuContent.appendChild( placeholder );
}

function attachBlockMenuSearch() {
	insertBlockMenuSearchInput.addEventListener( 'keyup', filterBlockMenu, false );
	insertBlockMenuSearchInput.addEventListener( 'input', filterBlockMenu, false );
	selectBlockInMenu();
	renderBlockMenu();

	function filterBlockMenu( event ) {
		searchBlockFilter = event.target.value;
		selectBlockInMenu();
		renderBlockMenu();
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
	hideInlineControls();
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
	updateBlockControlsPosition( className );
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
