// Layout definitions keyed by layout type.
// Provides a common definition of slugs, classnames, base styles, and spacing styles for each layout type.
// If making changes or additions to layout definitions, be sure to update the corresponding PHP definitions in
// `block-supports/layout.php` so that the server-side and client-side definitions match.
export const LAYOUT_DEFINITIONS = {
	default: {
		name: 'default',
		slug: 'flow',
		className: 'is-layout-flow',
		baseStyles: [
			{
				selector: ' > .alignleft',
				rules: {
					float: 'left',
					'margin-inline-start': '0',
					'margin-inline-end': '2em',
				},
			},
			{
				selector: ' > .alignright',
				rules: {
					float: 'right',
					'margin-inline-start': '2em',
					'margin-inline-end': '0',
				},
			},
			{
				selector: ' > .aligncenter',
				rules: {
					'margin-left': 'auto !important',
					'margin-right': 'auto !important',
				},
			},
		],
		spacingStyles: [
			{
				selector: ' > :first-child:first-child',
				rules: {
					'margin-block-start': '0',
				},
			},
			{
				selector: ' > :last-child:last-child',
				rules: {
					'margin-block-end': '0',
				},
			},
			{
				selector: ' > *',
				rules: {
					'margin-block-start': null,
					'margin-block-end': '0',
				},
			},
		],
	},
	constrained: {
		name: 'constrained',
		slug: 'constrained',
		className: 'is-layout-constrained',
		baseStyles: [
			{
				selector: ' > .alignleft',
				rules: {
					float: 'left',
					'margin-inline-start': '0',
					'margin-inline-end': '2em',
				},
			},
			{
				selector: ' > .alignright',
				rules: {
					float: 'right',
					'margin-inline-start': '2em',
					'margin-inline-end': '0',
				},
			},
			{
				selector: ' > .aligncenter',
				rules: {
					'margin-left': 'auto !important',
					'margin-right': 'auto !important',
				},
			},
			{
				selector:
					' > :where(:not(.alignleft):not(.alignright):not(.alignfull))',
				rules: {
					'max-width': 'var(--wp--style--global--content-size)',
					'margin-left': 'auto !important',
					'margin-right': 'auto !important',
				},
			},
			{
				selector: ' > .alignwide',
				rules: {
					'max-width': 'var(--wp--style--global--wide-size)',
				},
			},
		],
		spacingStyles: [
			{
				selector: ' > :first-child:first-child',
				rules: {
					'margin-block-start': '0',
				},
			},
			{
				selector: ' > :last-child:last-child',
				rules: {
					'margin-block-end': '0',
				},
			},
			{
				selector: ' > *',
				rules: {
					'margin-block-start': null,
					'margin-block-end': '0',
				},
			},
		],
	},
	flex: {
		name: 'flex',
		slug: 'flex',
		className: 'is-layout-flex',
		displayMode: 'flex',
		baseStyles: [
			{
				selector: '',
				rules: {
					'flex-wrap': 'wrap',
					'align-items': 'center',
				},
			},
			{
				selector: ' > *',
				rules: {
					margin: '0',
				},
			},
		],
		spacingStyles: [
			{
				selector: '',
				rules: {
					gap: null,
				},
			},
		],
	},
	grid: {
		name: 'grid',
		slug: 'grid',
		className: 'is-layout-grid',
		displayMode: 'grid',
		baseStyles: [
			{
				selector: ' > *',
				rules: {
					margin: '0',
				},
			},
		],
		spacingStyles: [
			{
				selector: '',
				rules: {
					gap: null,
				},
			},
		],
	},
};
