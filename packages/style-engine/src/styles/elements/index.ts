/**
 * Internal dependencies
 */
import type { Style } from '../../types';

const link = {
	name: 'link',
	getClassNames: ( style: Style ) => {
		const classNames = [];
		const styleValue: string | undefined =
			style?.elements?.link?.color?.text;
		if ( styleValue ) {
			classNames.push( 'has-link-color' );
		}

		return classNames;
	},
};

export default [ link ];
