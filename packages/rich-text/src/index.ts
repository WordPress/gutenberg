export { store } from './store';
export { applyFormat } from './apply-format';
export { concat } from './concat';
export { RichTextData, create } from './create';
export { getActiveFormat } from './get-active-format';
export { getActiveFormats } from './get-active-formats';
export { getActiveObject } from './get-active-object';
export { getTextContent } from './get-text-content';
export { isCollapsed } from './is-collapsed';
export { isEmpty } from './is-empty';
export { join } from './join';
export { registerFormatType } from './register-format-type';
export { removeFormat } from './remove-format';
export { remove } from './remove';
export { replace } from './replace';
export { insert } from './insert';
export { insertObject } from './insert-object';
export { slice } from './slice';
export { split } from './split';
export { toDom as __unstableToDom } from './to-dom';
export { toHTMLString } from './to-html-string';
export { toggleFormat } from './toggle-format';
export { unregisterFormatType } from './unregister-format-type';
export { createElement as __unstableCreateElement } from './create-element';

export { useAnchorRef } from './component/use-anchor-ref';
export { useAnchor } from './component/use-anchor';

export {
	default as __experimentalRichText,
	useRichText as __unstableUseRichText,
} from './component';

/**
 * An object which represents a formatted string. See main `@wordpress/rich-text`
 * documentation for more information.
 */
export type { RichTextValue } from './types';
