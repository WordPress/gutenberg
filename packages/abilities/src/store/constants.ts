/**
 * Store constants
 */
export const STORE_NAME = 'core/abilities';

// Validation patterns
export const ABILITY_NAME_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/;
export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Action types
export const REGISTER_ABILITY = 'REGISTER_ABILITY';
export const UNREGISTER_ABILITY = 'UNREGISTER_ABILITY';
export const REGISTER_ABILITY_CATEGORY = 'REGISTER_ABILITY_CATEGORY';
export const UNREGISTER_ABILITY_CATEGORY = 'UNREGISTER_ABILITY_CATEGORY';
