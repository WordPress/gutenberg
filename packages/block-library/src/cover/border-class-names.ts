const BORDER_PROPERTIES = [ 'width', 'style', 'color' ] as const;
const BORDER_SIDES = [ 'top', 'right', 'bottom', 'left' ] as const;

export interface BorderClassNames {
	'has-border': boolean;
	'has-border-radius': boolean;
}

function isSet( value: unknown ): boolean {
	return (
		( typeof value === 'string' && value.trim() !== '' ) ||
		typeof value === 'number'
	);
}

function isObject( value: unknown ): value is Record< string, unknown > {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

/**
 * Returns the `has-border` and `has-border-radius` classNames for a cover.
 *
 * The cover only clips its content when both are set, so elements such as
 * Navigation submenus can extend past it otherwise. On the front end the
 * render callback adds the same classes, so saved markup doesn't change.
 *
 * @param attributes The block attributes.
 * @return The classNames, keyed for `clsx`.
 */
export function getBorderClassNames(
	attributes: Record< string, unknown >
): BorderClassNames {
	const style = attributes.style;
	const border =
		isObject( style ) && isObject( style.border ) ? style.border : {};

	const hasBorder =
		isSet( attributes.borderColor ) ||
		BORDER_PROPERTIES.some( ( property ) => isSet( border[ property ] ) ) ||
		BORDER_SIDES.some( ( side ) => {
			const sideBorder = border[ side ];
			return (
				isObject( sideBorder ) &&
				BORDER_PROPERTIES.some( ( property ) =>
					isSet( sideBorder[ property ] )
				)
			);
		} );

	const radius = border.radius;
	const hasBorderRadius = isObject( radius )
		? Object.values( radius ).some( isSet )
		: isSet( radius );

	return {
		'has-border': hasBorder,
		'has-border-radius': hasBorderRadius,
	};
}
