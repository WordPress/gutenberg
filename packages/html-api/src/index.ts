export { TagProcessor } from './tag-processor';
export type {
	CommentType,
	ParserState,
	ParsingNamespace,
	Span,
	TagQuery,
	TextNodeClassification,
} from './tag-processor';
export {
	decode,
	decodeAttribute,
	decodeTextNode,
	readCharacterReference,
} from './decoder';
export type { DecodingContext } from './decoder';
