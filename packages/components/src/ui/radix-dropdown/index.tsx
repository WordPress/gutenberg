/**
 * External dependencies
 */
// Baseline: export all radix components
export * from '@radix-ui/react-dropdown-menu';

/**
 * Internal dependencies
 */
// Overrides some radix components with our styled version
export {
	Arrow,
	CheckboxItem,
	Content,
	Item,
	ItemIndicator,
	Label,
	RadioItem,
	Root,
	Separator,
	SubContent,
	SubTrigger,
} from './styles';

// Questions:
// - do we want to have our own JSDocs ?
// - do we want to more explicitly PICK prop types?
