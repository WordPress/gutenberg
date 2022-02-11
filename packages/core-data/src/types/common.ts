export interface FullRawObject {
	/**
	 * Data as it exists in the database.
	 */
	raw: string;
	/**
	 * Data transformed for display.
	 */
	rendered: string;
}

/**
 * The raw data representation.
 */
export type RawObject< Context extends EntityContext > = Pick<
	FullRawObject,
	Context extends EntityContext.edit ? 'raw' | 'rendered' : 'rendered'
>;

type DefaultRawObject = RawObject< EntityContext.view >;

export type RawString = string;
export type RawData = Partial< DefaultRawObject > | RawString;

export type PostStatus = 'publish' | 'future' | 'draft' | 'pending' | 'private';

export type OpenOrClosed = 'open' | 'closed';
export type ActiveOrInactive = 'active' | 'inactive';

export type TemplateContent =
	| {
			/**
			 * Content for the template, as it exists in the database.
			 */
			raw?: string;
			/**
			 * Version of the content block format used by the template.
			 */
			block_version?: number;
	  }
	| string;

export interface EntityRecordWithRawData<
	RawType extends RawData = DefaultRawObject
> {}

export interface AvatarUrls {
	/**
	 * Avatar URL with image size of 24 pixels.
	 */
	'24'?: string;
	/**
	 * Avatar URL with image size of 48 pixels.
	 */
	'48'?: string;
	/**
	 * Avatar URL with image size of 96 pixels.
	 */
	'96'?: string;

	[ k: string ]: string;
}

export enum EntityContext {
	view = 'view',
	edit = 'edit',
	embed = 'embed',
}
export type view = EntityContext.view;
export type edit = EntityContext.edit;
export type embed = EntityContext.embed;

export enum RawDataType {
	default,
	RawDataIsString,
}

export type RawField<
	RawDataOverride extends RawDataType,
	T
> = RawDataOverride extends RawDataType.RawDataIsString ? string : T;

export type OnlyInContexts<
	FieldType,
	AvailableInContexts extends EntityContext,
	Context extends EntityContext
> = AvailableInContexts extends Context ? FieldType : never;

export type DifferentPerContext<
	ViewType,
	EditType,
	EmbedType,
	Context extends EntityContext
> = Context extends view
	? ViewType
	: Context extends edit
	? EditType
	: EmbedType;
