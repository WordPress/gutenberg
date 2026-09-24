import type { Props, SizeToken } from './types';
import styles from './style.module.scss';

const paddingSizes = {
	none: 'none',
	xSmall: 'x-small',
	small: 'small',
	medium: 'medium',
	large: 'large',
};

const getSinglePaddingClass = ( side: string, size: SizeToken ) =>
	styles[ `padding-${ side }-${ paddingSizes[ size ] ?? 'medium' }` ];

export const getPaddingBySize = ( size: Props[ 'size' ] ) => {
	if ( typeof size === 'string' ) {
		// Keep the undocumented legacy alias for older consumers.
		const paddingSize =
			size === 'extraSmall'
				? 'x-small'
				: paddingSizes[ size as SizeToken ];
		return styles[ `padding-${ paddingSize }` ];
	}

	if ( size ) {
		return [
			getSinglePaddingClass( 'block-start', size.blockStart ),
			getSinglePaddingClass( 'block-end', size.blockEnd ),
			getSinglePaddingClass( 'inline-start', size.inlineStart ),
			getSinglePaddingClass( 'inline-end', size.inlineEnd ),
		];
	}

	return styles[ 'padding-medium' ];
};
