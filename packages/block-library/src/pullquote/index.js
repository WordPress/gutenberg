/**
 * External dependencies
 */
import { includes, map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	getColorClassName,
	PanelColorSettings,
	RichText,
	withColors,
} from '@wordpress/editor';
import {
	Fragment,
} from '@wordpress/element';

const toRichTextValue = ( value ) => map( value, ( ( subValue ) => subValue.children ) );
const fromRichTextValue = ( value ) => map( value, ( subValue ) => ( {
	children: subValue,
} ) );
const blockAttributes = {
	value: {
		type: 'array',
		source: 'query',
		selector: 'blockquote > p',
		query: {
			children: {
				source: 'node',
			},
		},
	},
	citation: {
		type: 'array',
		source: 'children',
		selector: 'cite',
	},
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
	},
};

const STYLIZED_STYLE_NAME = 'stylized';
const STYLIZED_CLASS = `is-style-${ STYLIZED_STYLE_NAME }`;

export const name = 'core/pullquote';

export const settings = {

	title: __( 'Pullquote' ),

	description: __( 'Highlight a quote from your post or page by displaying it as a graphic element.' ),

	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><polygon points="21 18 2 18 2 20 21 20" /><path d="m19 10v4h-15v-4h15m1-2h-17c-0.55 0-1 0.45-1 1v6c0 0.55 0.45 1 1 1h17c0.55 0 1-0.45 1-1v-6c0-0.55-0.45-1-1-1z" /><polygon points="21 4 2 4 2 6 21 6" /></svg>,

	category: 'formatting',

	attributes: blockAttributes,

	styles: [
		{ name: 'default', label: __( 'Regular' ), isDefault: true },
		{ name: STYLIZED_STYLE_NAME, label: __( 'Stylized' ) },
	],

	supports: {
		align: true,
	},

	edit: withColors( 'backgroundColor' )(
		( { attributes, backgroundColor, setAttributes, isSelected, className, setBackgroundColor } ) => {
			const { value, citation } = attributes;

			let colorSettings = null;
			const isStylizedStyleVariation = includes( className, STYLIZED_CLASS );
			if ( isStylizedStyleVariation ) {
				colorSettings = (
					<InspectorControls>
						<PanelColorSettings
							title={ __( 'Color Settings' ) }
							colorSettings={ [
								{
									value: backgroundColor.color,
									onChange: setBackgroundColor,
									label: __( 'Background Color' ),
								},
							] }
						/>
					</InspectorControls>
				);
			}

			return (
				<Fragment>
					<figure style={ isStylizedStyleVariation ? { backgroundColor: backgroundColor.color } : undefined } className={ classnames(
						className, {
							[ backgroundColor.class ]: isStylizedStyleVariation && backgroundColor.class,
						} ) }>
						<blockquote>
							<RichText
								multiline="p"
								value={ toRichTextValue( value ) }
								onChange={
									( nextValue ) => setAttributes( {
										value: fromRichTextValue( nextValue ),
									} )
								}
								/* translators: the text of the quotation */
								placeholder={ __( 'Write quote…' ) }
								wrapperClassName="block-library-pullquote__content"
							/>
							{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
								<RichText
									value={ citation }
									/* translators: the individual or entity quoted */
									placeholder={ __( 'Write citation…' ) }
									onChange={
										( nextCitation ) => setAttributes( {
											citation: nextCitation,
										} )
									}
									className="wp-block-pullquote__citation"
								/>
							) }
						</blockquote>
					</figure>
					{ colorSettings }
				</Fragment>
			);
		}
	),

	save( { attributes } ) {
		const { backgroundColor, value, citation, className } = attributes;
		const isStylizedStyleVariation = includes( className, STYLIZED_CLASS );
		const backgroundClass = getColorClassName( 'background-color', backgroundColor );

		const figureClasses = classnames( {
			[ backgroundClass ]: isStylizedStyleVariation && backgroundClass,
		} );

		return (
			<figure className={ figureClasses }>
				<blockquote>
					<RichText.Content value={ toRichTextValue( value ) } />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			</figure>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
		},
		save( { attributes } ) {
			const { value, citation } = attributes;
			return (
				<blockquote>
					<RichText.Content value={ toRichTextValue( value ) } />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			);
		},
	}, {
		attributes: {
			...blockAttributes,
			citation: {
				type: 'array',
				source: 'children',
				selector: 'footer',
			},
			align: {
				type: 'string',
				default: 'none',
			},
		},

		save( { attributes } ) {
			const { value, citation, align } = attributes;

			return (
				<blockquote className={ `align${ align }` }>
					<RichText.Content value={ toRichTextValue( value ) } />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="footer" value={ citation } /> }
				</blockquote>
			);
		},
	} ],
};
