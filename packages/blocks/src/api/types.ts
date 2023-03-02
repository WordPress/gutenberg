/**
 * Describes options for Block serialization.
 *
 * Used by the Block [serializer](./serializer.js).
 *
 * @public
 */
export type BlockSerializationOptions = {
	/**
	 * Whether to output HTML comments around blocks.
	 */
	isCommentDelimited?: boolean;

	/**
	 * TODO Undocumented
	 */
	isInnerBlocks?: boolean;

	/**
	 * If a block is migrated from a deprecated version, skip logging the migration details.
	 *
	 * @internal
	 */
	__unstableSkipMigrationLogs?: boolean;

	/**
	 * Whether to skip autop when processing freeform content.
	 *
	 * @internal
	 */
	__unstableSkipAutop?: boolean;
};

/**
 * Describes options for Block parsing.
 *
 * Used by the block [parser](./parser/index.js).
 *
 * @public
 */
export type BlockParseOptions = {
	/**
	 * If a block is migrated from a deprecated version, skip logging the migration details.
	 *
	 * @internal
	 */
	__unstableSkipMigrationLogs?: boolean;

	/**
	 * Whether to skip autop when processing freeform content.
	 *
	 * @internal
	 */
	__unstableSkipAutop?: boolean;
};
