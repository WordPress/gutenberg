/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock, parseWithAttributeSchema } from '@wordpress/blocks';
import { RichText, useBlockProps } from '@wordpress/block-editor';

export const migrateToQuoteV2 = ( attributes ) => {
	const { value, ...restAttributes } = attributes;

	return [
		{
			...restAttributes,
		},
		value
			? parseWithAttributeSchema( value, {
					type: 'array',
					source: 'query',
					selector: 'p',
					query: {
						content: {
							type: 'string',
							source: 'html',
						},
					},
			  } ).map( ( { content } ) =>
					createBlock( 'core/paragraph', { content } )
			  )
			: createBlock( 'core/paragraph' ),
	];
};

const v3 = {
	attributes: {
		value: {
			type: 'string',
			source: 'html',
			selector: 'blockquote',
			multiline: 'p',
			default: '',
			__experimentalRole: 'content',
		},
		citation: {
			type: 'string',
			source: 'html',
			selector: 'cite',
			default: '',
			__experimentalRole: 'content',
		},
		align: {
			type: 'string',
		},
	},
	supports: {
		anchor: true,
		__experimentalSlashInserter: true,
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalLetterSpacing: true,
			__experimentalTextTransform: true,
			__experimentalDefaultControls: {
				fontSize: true,
				fontAppearance: true,
			},
		},
	},
	save( { attributes } ) {
		const { align, value, citation } = attributes;

		const className = classnames( {
			[ `has-text-align-${ align }` ]: align,
		} );

		return (
			<blockquote { ...useBlockProps.save( { className } ) }>
				<RichText.Content multiline value={ value } />
				{ ! RichText.isEmpty( citation ) && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		);
	},
	migrate: migrateToQuoteV2,
};

const v2 = {
	attributes: {
		value: {
			type: 'string',
			source: 'html',
			selector: 'blockquote',
			multiline: 'p',
			default: '',
		},
		citation: {
			type: 'string',
			source: 'html',
			selector: 'cite',
			default: '',
		},
		align: {
			type: 'string',
		},
	},
	migrate: migrateToQuoteV2,
	save( { attributes } ) {
		const { align, value, citation } = attributes;

		return (
			<blockquote style={ { textAlign: align ? align : null } }>
				<RichText.Content multiline value={ value } />
				{ ! RichText.isEmpty( citation ) && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		);
	},
};

const v1 = {
	attributes: {
		value: {
			type: 'string',
			source: 'html',
			selector: 'blockquote',
			multiline: 'p',
			default: '',
		},
		citation: {
			type: 'string',
			source: 'html',
			selector: 'cite',
			default: '',
		},
		align: {
			type: 'string',
		},
		style: {
			type: 'number',
			default: 1,
		},
	},

	migrate( attributes ) {
		if ( attributes.style === 2 ) {
			const { style, ...restAttributes } = attributes;
			return migrateToQuoteV2( {
				...restAttributes,
				className: attributes.className
					? attributes.className + ' is-style-large'
					: 'is-style-large',
			} );
		}

		return migrateToQuoteV2( attributes );
	},

	save( { attributes } ) {
		const { align, value, citation, style } = attributes;

		return (
			<blockquote
				className={ style === 2 ? 'is-large' : '' }
				style={ { textAlign: align ? align : null } }
			>
				<RichText.Content multiline value={ value } />
				{ ! RichText.isEmpty( citation ) && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		);
	},
};

const v0 = {
	attributes: {
		value: {
			type: 'string',
			source: 'html',
			selector: 'blockquote',
			multiline: 'p',
			default: '',
		},
		citation: {
			type: 'string',
			source: 'html',
			selector: 'footer',
			default: '',
		},
		align: {
			type: 'string',
		},
		style: {
			type: 'number',
			default: 1,
		},
	},

	migrate( attributes ) {
		if ( ! isNaN( parseInt( attributes.style ) ) ) {
			const { style, ...restAttributes } = attributes;
			return migrateToQuoteV2( {
				...restAttributes,
			} );
		}

		return migrateToQuoteV2( attributes );
	},

	save( { attributes } ) {
		const { align, value, citation, style } = attributes;

		return (
			<blockquote
				className={ `blocks-quote-style-${ style }` }
				style={ { textAlign: align ? align : null } }
			>
				<RichText.Content multiline value={ value } />
				{ ! RichText.isEmpty( citation ) && (
					<RichText.Content tagName="footer" value={ citation } />
				) }
			</blockquote>
		);
	},
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 *
 * Old deprecations may need to be updated as well.
 *
 * See block-deprecation.md
 */
export default [ v3, v2, v1, v0 ];
