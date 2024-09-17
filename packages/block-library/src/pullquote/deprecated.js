/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	getColorObjectByAttributeValues,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_CLASS } from './shared';

const blockAttributes = {
	value: {
		type: 'string',
		source: 'html',
		selector: 'blockquote',
		multiline: 'p',
	},
	citation: {
		type: 'string',
		source: 'html',
		selector: 'cite',
		default: '',
	},
	mainColor: {
		type: 'string',
	},
	customMainColor: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
};

function parseBorderColor( styleString ) {
	if ( ! styleString ) {
		return;
	}
	const matches = styleString.match( /border-color:([^;]+)[;]?/ );
	if ( matches && matches[ 1 ] ) {
		return matches[ 1 ];
	}
}

function multilineToInline( value ) {
	value = value || `<p></p>`;
	const padded = `</p>${ value }<p>`;
	const values = padded.split( `</p><p>` );

	values.shift();
	values.pop();

	return values.join( '<br>' );
}

const v5 = {
	attributes: {
		value: {
			type: 'string',
			source: 'html',
			selector: 'blockquote',
			multiline: 'p',
			__experimentalRole: 'content',
		},
		citation: {
			type: 'string',
			source: 'html',
			selector: 'cite',
			default: '',
			__experimentalRole: 'content',
		},
		textAlign: {
			type: 'string',
		},
	},
	save( { attributes } ) {
		const { textAlign, citation, value } = attributes;
		const shouldShowCitation = ! RichText.isEmpty( citation );

		return (
			<figure
				{ ...useBlockProps.save( {
					className: clsx( {
						[ `has-text-align-${ textAlign }` ]: textAlign,
					} ),
				} ) }
			>
				<blockquote>
					<RichText.Content value={ value } multiline />
					{ shouldShowCitation && (
						<RichText.Content tagName="cite" value={ citation } />
					) }
				</blockquote>
			</figure>
		);
	},
	migrate( { value, ...attributes } ) {
		return {
			value: multilineToInline( value ),
			...attributes,
		};
	},
};

// TODO: this is ripe for a bit of a clean up according to the example in https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/#example

const v4 = {
	attributes: {
		...blockAttributes,
	},
	save( { attributes } ) {
		const {
			mainColor,
			customMainColor,
			customTextColor,
			textColor,
			value,
			citation,
			className,
		} = attributes;

		const isSolidColorStyle = className?.includes( SOLID_COLOR_CLASS );

		let figureClasses, figureStyles;

		// Is solid color style
		if ( isSolidColorStyle ) {
			const backgroundClass = getColorClassName(
				'background-color',
				mainColor
			);

			figureClasses = clsx( {
				'has-background': backgroundClass || customMainColor,
				[ backgroundClass ]: backgroundClass,
			} );

			figureStyles = {
				backgroundColor: backgroundClass ? undefined : customMainColor,
			};
			// Is normal style and a custom color is being used ( we can set a style directly with its value)
		} else if ( customMainColor ) {
			figureStyles = {
				borderColor: customMainColor,
			};
		}

		const blockquoteTextColorClass = getColorClassName(
			'color',
			textColor
		);
		const blockquoteClasses = clsx( {
			'has-text-color': textColor || customTextColor,
			[ blockquoteTextColorClass ]: blockquoteTextColorClass,
		} );

		const blockquoteStyles = blockquoteTextColorClass
			? undefined
			: { color: customTextColor };

		return (
			<figure
				{ ...useBlockProps.save( {
					className: figureClasses,
					style: figureStyles,
				} ) }
			>
				<blockquote
					className={ blockquoteClasses }
					style={ blockquoteStyles }
				>
					<RichText.Content value={ value } multiline />
					{ ! RichText.isEmpty( citation ) && (
						<RichText.Content tagName="cite" value={ citation } />
					) }
				</blockquote>
			</figure>
		);
	},
	migrate( {
		value,
		className,
		mainColor,
		customMainColor,
		customTextColor,
		...attributes
	} ) {
		const isSolidColorStyle = className?.includes( SOLID_COLOR_CLASS );
		let style;

		if ( customMainColor ) {
			if ( ! isSolidColorStyle ) {
				// Block supports: Set style.border.color if a deprecated block has a default style and a `customMainColor` attribute.
				style = {
					border: {
						color: customMainColor,
					},
				};
			} else {
				// Block supports: Set style.color.background if a deprecated block has a solid style and a `customMainColor` attribute.
				style = {
					color: {
						background: customMainColor,
					},
				};
			}
		}

		// Block supports: Set style.color.text if a deprecated block has a `customTextColor` attribute.
		if ( customTextColor && style ) {
			style.color = {
				...style.color,
				text: customTextColor,
			};
		}

		return {
			value: multilineToInline( value ),
			className,
			backgroundColor: isSolidColorStyle ? mainColor : undefined,
			borderColor: isSolidColorStyle ? undefined : mainColor,
			textAlign: isSolidColorStyle ? 'left' : undefined,
			style,
			...attributes,
		};
	},
};

const v3 = {
	attributes: {
		...blockAttributes,
		// figureStyle is an attribute that never existed.
		// We are using it as a way to access the styles previously applied to the figure.
		figureStyle: {
			source: 'attribute',
			selector: 'figure',
			attribute: 'style',
		},
	},
	save( { attributes } ) {
		const {
			mainColor,
			customMainColor,
			textColor,
			customTextColor,
			value,
			citation,
			className,
			figureStyle,
		} = attributes;

		const isSolidColorStyle = className?.includes( SOLID_COLOR_CLASS );

		let figureClasses, figureStyles;

		// Is solid color style
		if ( isSolidColorStyle ) {
			const backgroundClass = getColorClassName(
				'background-color',
				mainColor
			);

			figureClasses = clsx( {
				'has-background': backgroundClass || customMainColor,
				[ backgroundClass ]: backgroundClass,
			} );

			figureStyles = {
				backgroundColor: backgroundClass ? undefined : customMainColor,
			};
			// Is normal style and a custom color is being used ( we can set a style directly with its value)
		} else if ( customMainColor ) {
			figureStyles = {
				borderColor: customMainColor,
			};
			// If normal style and a named color are being used, we need to retrieve the color value to set the style,
			// as there is no expectation that themes create classes that set border colors.
		} else if ( mainColor ) {
			// Previously here we queried the color settings to know the color value
			// of a named color. This made the save function impure and the block was refactored,
			// because meanwhile a change in the editor made it impossible to query color settings in the save function.
			// Here instead of querying the color settings to know the color value, we retrieve the value
			// directly from the style previously serialized.
			const borderColor = parseBorderColor( figureStyle );
			figureStyles = {
				borderColor,
			};
		}

		const blockquoteTextColorClass = getColorClassName(
			'color',
			textColor
		);
		const blockquoteClasses =
			( textColor || customTextColor ) &&
			clsx( 'has-text-color', {
				[ blockquoteTextColorClass ]: blockquoteTextColorClass,
			} );

		const blockquoteStyles = blockquoteTextColorClass
			? undefined
			: { color: customTextColor };

		return (
			<figure className={ figureClasses } style={ figureStyles }>
				<blockquote
					className={ blockquoteClasses }
					style={ blockquoteStyles }
				>
					<RichText.Content value={ value } multiline />
					{ ! RichText.isEmpty( citation ) && (
						<RichText.Content tagName="cite" value={ citation } />
					) }
				</blockquote>
			</figure>
		);
	},
	migrate( {
		value,
		className,
		figureStyle,
		mainColor,
		customMainColor,
		customTextColor,
		...attributes
	} ) {
		const isSolidColorStyle = className?.includes( SOLID_COLOR_CLASS );
		let style;

		if ( customMainColor ) {
			if ( ! isSolidColorStyle ) {
				// Block supports: Set style.border.color if a deprecated block has a default style and a `customMainColor` attribute.
				style = {
					border: {
						color: customMainColor,
					},
				};
			} else {
				// Block supports: Set style.color.background if a deprecated block has a solid style and a `customMainColor` attribute.
				style = {
					color: {
						background: customMainColor,
					},
				};
			}
		}

		// Block supports: Set style.color.text if a deprecated block has a `customTextColor` attribute.
		if ( customTextColor && style ) {
			style.color = {
				...style.color,
				text: customTextColor,
			};
		}
		// If is the default style, and a main color is set,
		// migrate the main color value into a custom border color.
		// The custom border color value is retrieved by parsing the figure styles.
		if ( ! isSolidColorStyle && mainColor && figureStyle ) {
			const borderColor = parseBorderColor( figureStyle );
			if ( borderColor ) {
				return {
					value: multilineToInline( value ),
					...attributes,
					className,
					// Block supports: Set style.border.color if a deprecated block has `mainColor`, inline border CSS and is not a solid color style.
					style: {
						border: {
							color: borderColor,
						},
					},
				};
			}
		}
		return {
			value: multilineToInline( value ),
			className,
			backgroundColor: isSolidColorStyle ? mainColor : undefined,
			borderColor: isSolidColorStyle ? undefined : mainColor,
			textAlign: isSolidColorStyle ? 'left' : undefined,
			style,
			...attributes,
		};
	},
};

const v2 = {
	attributes: blockAttributes,
	save( { attributes } ) {
		const {
			mainColor,
			customMainColor,
			textColor,
			customTextColor,
			value,
			citation,
			className,
		} = attributes;
		const isSolidColorStyle = className?.includes( SOLID_COLOR_CLASS );

		let figureClass, figureStyles;
		// Is solid color style
		if ( isSolidColorStyle ) {
			figureClass = getColorClassName( 'background-color', mainColor );
			if ( ! figureClass ) {
				figureStyles = {
					backgroundColor: customMainColor,
				};
			}
			// Is normal style and a custom color is being used ( we can set a style directly with its value)
		} else if ( customMainColor ) {
			figureStyles = {
				borderColor: customMainColor,
			};
			// Is normal style and a named color is being used, we need to retrieve the color value to set the style,
			// as there is no expectation that themes create classes that set border colors.
		} else if ( mainColor ) {
			const colors =
				select( blockEditorStore ).getSettings().colors ?? [];
			const colorObject = getColorObjectByAttributeValues(
				colors,
				mainColor
			);
			figureStyles = {
				borderColor: colorObject.color,
			};
		}

		const blockquoteTextColorClass = getColorClassName(
			'color',
			textColor
		);
		const blockquoteClasses =
			textColor || customTextColor
				? clsx( 'has-text-color', {
						[ blockquoteTextColorClass ]: blockquoteTextColorClass,
				  } )
				: undefined;
		const blockquoteStyle = blockquoteTextColorClass
			? undefined
			: { color: customTextColor };
		return (
			<figure className={ figureClass } style={ figureStyles }>
				<blockquote
					className={ blockquoteClasses }
					style={ blockquoteStyle }
				>
					<RichText.Content value={ value } multiline />
					{ ! RichText.isEmpty( citation ) && (
						<RichText.Content tagName="cite" value={ citation } />
					) }
				</blockquote>
			</figure>
		);
	},
	migrate( {
		value,
		className,
		mainColor,
		customMainColor,
		customTextColor,
		...attributes
	} ) {
		const isSolidColorStyle = className?.includes( SOLID_COLOR_CLASS );
		let style = {};

		if ( customMainColor ) {
			if ( ! isSolidColorStyle ) {
				// Block supports: Set style.border.color if a deprecated block has a default style and a `customMainColor` attribute.
				style = {
					border: {
						color: customMainColor,
					},
				};
			} else {
				// Block supports: Set style.color.background if a deprecated block has a solid style and a `customMainColor` attribute.
				style = {
					color: {
						background: customMainColor,
					},
				};
			}
		}

		// Block supports: Set style.color.text if a deprecated block has a `customTextColor` attribute.
		if ( customTextColor && style ) {
			style.color = {
				...style.color,
				text: customTextColor,
			};
		}

		return {
			value: multilineToInline( value ),
			className,
			backgroundColor: isSolidColorStyle ? mainColor : undefined,
			borderColor: isSolidColorStyle ? undefined : mainColor,
			textAlign: isSolidColorStyle ? 'left' : undefined,
			style,
			...attributes,
		};
	},
};

const v1 = {
	attributes: {
		...blockAttributes,
	},
	save( { attributes } ) {
		const { value, citation } = attributes;
		return (
			<blockquote>
				<RichText.Content value={ value } multiline />
				{ ! RichText.isEmpty( citation ) && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		);
	},
	migrate( { value, ...attributes } ) {
		return {
			value: multilineToInline( value ),
			...attributes,
		};
	},
};

const v0 = {
	attributes: {
		...blockAttributes,
		citation: {
			type: 'string',
			source: 'html',
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
				<RichText.Content value={ value } multiline />
				{ ! RichText.isEmpty( citation ) && (
					<RichText.Content tagName="footer" value={ citation } />
				) }
			</blockquote>
		);
	},
	migrate( { value, ...attributes } ) {
		return {
			value: multilineToInline( value ),
			...attributes,
		};
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
export default [ v5, v4, v3, v2, v1, v0 ];
