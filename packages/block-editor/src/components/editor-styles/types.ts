import type {
	EditorStyle,
	TransformOptions,
} from '../../utils/transform-styles/types';

/**
 * A style `EditorStyles` renders: CSS to transform, or SVG assets when its
 * type is `svgs`.
 */
export interface EditorStylesStyle extends Partial< EditorStyle > {
	id?: string;
	__unstableType?: string;
	assets?: string;
}

/**
 * Props of `EditorStyles`.
 */
export interface EditorStylesProps {
	styles?: EditorStylesStyle[] | Record< string, EditorStylesStyle >;
	scope?: string;
	transformOptions?: TransformOptions;
}
