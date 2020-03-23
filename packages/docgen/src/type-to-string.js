/**
 * External dependencies
 */
import { SyntaxKind } from 'typescript';

module.exports = ( type ) => {
	if ( type === undefined ) {
		return 'undocumented';
	}

	switch ( type.kind ) {
		case SyntaxKind.AnyKeyword:
		case SyntaxKind.JSDocAllType:
			return 'any';
	}
};
