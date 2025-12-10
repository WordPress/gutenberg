/**
 * WordPress Abilities API Types
 */

/**
 * Callback function for client-side abilities.
 */
export type AbilityCallback = (
	input: AbilityInput
) => AbilityOutput | Promise< AbilityOutput >;

/**
 * Permission callback function for client-side abilities.
 * Returns true if the ability can be executed, false otherwise.
 */
export type PermissionCallback = (
	input?: AbilityInput
) => boolean | Promise< boolean >;

/**
 * Represents an ability in the WordPress Abilities API.
 *
 * @see WP_Ability
 */
export interface Ability {
	/**
	 * The unique name/identifier of the ability, with its namespace.
	 * Example: 'my-plugin/my-ability'
	 * @see WP_Ability::get_name()
	 */
	name: string;

	/**
	 * The human-readable label for the ability.
	 * @see WP_Ability::get_label()
	 */
	label: string;

	/**
	 * The detailed description of the ability.
	 * @see WP_Ability::get_description()
	 */
	description: string;

	/**
	 * The category this ability belongs to.
	 * Must be a valid category slug (lowercase alphanumeric with dashes).
	 * Example: 'data-retrieval', 'user-management'
	 * @see WP_Ability::get_category()
	 */
	category: string;

	/**
	 * JSON Schema for the ability's input parameters.
	 * @see WP_Ability::get_input_schema()
	 */
	input_schema?: Record< string, any >;

	/**
	 * JSON Schema for the ability's output format.
	 * @see WP_Ability::get_output_schema()
	 */
	output_schema?: Record< string, any >;

	/**
	 * Callback function for ability execution.
	 * This property is required for all abilities.
	 */
	callback?: AbilityCallback;

	/**
	 * Permission callback for abilities.
	 * Called before executing the ability to check if it's allowed.
	 * If it returns false, the ability execution will be denied.
	 */
	permissionCallback?: PermissionCallback;

	/**
	 * Metadata about the ability.
	 */
	meta?: {
		annotations?: {
			clientRegistered?: boolean;
			serverRegistered?: boolean;
			readonly?: boolean;
			destructive?: boolean;
			idempotent?: boolean;
		};
		[ key: string ]: any;
	};
}

/**
 * The shape of the arguments for querying abilities.
 */
export interface AbilitiesQueryArgs {
	/**
	 * Optional category slug to filter abilities.
	 */
	category?: string;
}

/**
 * Represents an ability category in the WordPress Abilities API.
 *
 * @see WP_Ability_Category
 */
export interface AbilityCategory {
	/**
	 * The unique slug identifier for the category.
	 * Must be lowercase alphanumeric with dashes only.
	 * Example: 'data-retrieval', 'user-management'
	 * @see WP_Ability_Category::get_slug()
	 */
	slug: string;

	/**
	 * The human-readable label for the category.
	 * @see WP_Ability_Category::get_label()
	 */
	label: string;

	/**
	 * The detailed description of the category.
	 * @see WP_Ability_Category::get_description()
	 */
	description: string;

	/**
	 * Metadata about the category.
	 */
	meta?: {
		annotations?: {
			clientRegistered?: boolean;
			serverRegistered?: boolean;
		};
		[ key: string ]: any;
	};
}

/**
 * Arguments for registering an ability category.
 * Matches the server-side wp_register_ability_category() $args parameter.
 *
 * @see wp_register_ability_category()
 */
export interface AbilityCategoryArgs {
	/**
	 * The human-readable label for the category.
	 */
	label: string;

	/**
	 * The detailed description of the category.
	 */
	description: string;

	/**
	 * Optional metadata about the category.
	 */
	meta?: Record< string, any >;
}

/**
 * Input parameters for ability execution.
 * Can be any JSON-serializable value: primitive, array, object, or null.
 */
export type AbilityInput = any;

/**
 * Result from ability execution.
 * The actual shape depends on the ability's output schema.
 */
export type AbilityOutput = any;

/**
 * Validation error - just a message string.
 * The Abilities API wraps this with the appropriate error code.
 */
export type ValidationError = string;
