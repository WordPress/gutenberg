/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	Ability,
	AbilityCategory,
	AbilityCategoryArgs,
	AbilityCallback,
} from '../types';
import {
	REGISTER_ABILITY,
	UNREGISTER_ABILITY,
	REGISTER_ABILITY_CATEGORY,
	UNREGISTER_ABILITY_CATEGORY,
	ABILITY_NAME_PATTERN,
	CATEGORY_SLUG_PATTERN,
} from './constants';

type AbilityAnnotations = NonNullable< Ability[ 'meta' ] >[ 'annotations' ];

/**
 * Filters annotations to only include allowed keys with non-null values.
 *
 * @param sourceAnnotations The source annotations object to filter.
 * @param allowedKeys       Array of annotation keys to include.
 * @return Filtered annotations object.
 */
function filterAnnotations< K extends keyof NonNullable< AbilityAnnotations > >(
	sourceAnnotations: Record< string, boolean > | undefined,
	allowedKeys: readonly K[]
): NonNullable< AbilityAnnotations > {
	const annotations: NonNullable< AbilityAnnotations > = {};

	if ( sourceAnnotations ) {
		for ( const key of allowedKeys ) {
			if ( sourceAnnotations[ key ] !== undefined ) {
				annotations[ key ] = sourceAnnotations[ key ];
			}
		}
	}
	return annotations;
}

/**
 * Registers an ability in the store.
 *
 * This action validates the ability before registration. If validation fails,
 * an error will be thrown.
 *
 * @param  ability The ability to register.
 * @return Action object or function.
 * @throws {Error} If validation fails.
 */
export function registerAbility( ability: Ability ) {
	// @ts-expect-error - registry types are not yet available
	return ( { select, dispatch } ) => {
		if ( ! ability.name ) {
			throw new Error( 'Ability name is required' );
		}

		// Validate name format matches server implementation
		if ( ! ABILITY_NAME_PATTERN.test( ability.name ) ) {
			throw new Error(
				'Ability name must be a string containing a namespace prefix, i.e. "my-plugin/my-ability". It can only contain lowercase alphanumeric characters, dashes and the forward slash.'
			);
		}

		if ( ! ability.label ) {
			throw new Error(
				sprintf( 'Ability "%s" must have a label', ability.name )
			);
		}

		if ( ! ability.description ) {
			throw new Error(
				sprintf( 'Ability "%s" must have a description', ability.name )
			);
		}

		if ( ! ability.category ) {
			throw new Error(
				sprintf( 'Ability "%s" must have a category', ability.name )
			);
		}

		// Validate category format
		if ( ! CATEGORY_SLUG_PATTERN.test( ability.category ) ) {
			throw new Error(
				sprintf(
					'Ability "%1$s" has an invalid category. Category must be lowercase alphanumeric with dashes only. Got: "%2$s"',
					ability.name,
					ability.category
				)
			);
		}

		// Check that the category exists
		const categories = select.getAbilityCategories();
		const existingCategory = categories.find(
			( cat: AbilityCategory ) => cat.slug === ability.category
		);
		if ( ! existingCategory ) {
			throw new Error(
				sprintf(
					'Ability "%1$s" references non-existent category "%2$s". Please register the category first.',
					ability.name,
					ability.category
				)
			);
		}

		// Client-side abilities must have a callback
		if ( ability.callback && typeof ability.callback !== 'function' ) {
			throw new Error(
				sprintf(
					'Ability "%s" has an invalid callback. Callback must be a function',
					ability.name
				)
			);
		}

		// Check if ability is already registered
		const existingAbility = select.getAbility( ability.name );
		if ( existingAbility ) {
			// Check if this is a valid hybrid registration scenario
			const existingAnnotations = existingAbility.meta?.annotations;
			const newAnnotations = ability.meta?.annotations;

			// Existing ability must be server-registered (not client-only or hybrid)
			// and the new ability must not be server-registered only.
			if (
				! existingAnnotations?.serverRegistered ||
				existingAnnotations?.clientRegistered ||
				newAnnotations?.clientRegistered === false
			) {
				throw new Error(
					sprintf(
						'Ability "%s" is already registered',
						ability.name
					)
				);
			}

			// Only callback change is allowed - all other props must match
			const propsToCompare = [
				'name',
				'label',
				'description',
				'category',
				'input_schema',
				'output_schema',
			] as const;
			for ( const prop of propsToCompare ) {
				const existingValue = existingAbility[ prop ];
				const newValue = ability[ prop ];
				// Deep comparison for objects (schemas)
				if ( ! fastDeepEqual( existingValue, newValue ) ) {
					throw new Error(
						sprintf(
							'Cannot update ability "%1$s": only callback changes are allowed for hybrid abilities. Property "%2$s" differs.',
							ability.name,
							prop
						)
					);
				}
			}

			// Valid hybrid registration - update with callback and set clientRegistered
			const updatedAnnotations = {
				...existingAnnotations,
				clientRegistered: true,
			};

			dispatch( {
				type: REGISTER_ABILITY,
				ability: {
					...existingAbility,
					callback: ability.callback,
					permissionCallback: ability.permissionCallback,
					meta: { annotations: updatedAnnotations },
				},
			} );
			return;
		}

		const annotations = filterAnnotations( ability.meta?.annotations, [
			'readonly',
			'destructive',
			'idempotent',
			'serverRegistered',
			'clientRegistered',
		] );

		if ( ! annotations.serverRegistered ) {
			annotations.clientRegistered = true;
		}

		const meta = { annotations };

		// All validation passed, dispatch the registration action
		dispatch( {
			type: REGISTER_ABILITY,
			ability: {
				...ability,
				meta,
			},
		} );
	};
}

/**
 * Returns an action object used to unregister a client-side ability.
 *
 * @param name The name of the ability to unregister.
 * @return Action object.
 */
export function unregisterAbility( name: string ) {
	return {
		type: UNREGISTER_ABILITY,
		name,
	};
}

/**
 * Registers a callback for an existing ability.
 *
 * This action allows updating the callback of an already registered ability,
 * which is useful for hybrid abilities that are registered on the server
 * but need client-side execution callbacks.
 *
 * @param  name     The name of the ability to update.
 * @param  callback The callback function to register.
 * @return Action object or function.
 * @throws {Error} If the ability is not registered or callback is invalid.
 */
export function registerAbilityCallback(
	name: string,
	callback: AbilityCallback
) {
	// @ts-expect-error - registry types are not yet available
	return ( { select, dispatch } ) => {
		const existingAbility = select.getAbility( name );
		if ( ! existingAbility ) {
			throw new Error(
				sprintf( 'Ability "%s" is not registered', name )
			);
		}

		if ( existingAbility.meta?.annotations?.clientRegistered ) {
			throw new Error(
				sprintf(
					'Ability "%s" is already registered as a client-side ability',
					name
				)
			);
		}

		if ( typeof callback !== 'function' ) {
			throw new Error(
				sprintf( 'Callback for ability "%s" must be a function', name )
			);
		}

		const existingAnnotations = existingAbility.meta?.annotations || {};
		const annotations = {
			...existingAnnotations,
			clientRegistered: true,
		};

		dispatch( {
			type: REGISTER_ABILITY,
			ability: {
				...existingAbility,
				callback,
				meta: { annotations },
			},
		} );
	};
}

/**
 * Registers a client-side ability category in the store.
 *
 * This action validates the category before registration. If validation fails,
 * an error will be thrown.
 *
 * @param  slug The unique category slug identifier.
 * @param  args Category arguments (label, description, optional meta).
 * @return Action object or function.
 * @throws {Error} If validation fails.
 */
export function registerAbilityCategory(
	slug: string,
	args: AbilityCategoryArgs
) {
	// @ts-expect-error - registry types are not yet available
	return ( { select, dispatch } ) => {
		if ( ! slug ) {
			throw new Error( 'Category slug is required' );
		}

		// Validate slug format matches server implementation
		if ( ! CATEGORY_SLUG_PATTERN.test( slug ) ) {
			throw new Error(
				'Category slug must contain only lowercase alphanumeric characters and dashes.'
			);
		}

		// Check for duplicates
		const existingCategory = select.getAbilityCategory( slug );
		if ( existingCategory ) {
			throw new Error(
				sprintf( 'Category "%s" is already registered.', slug )
			);
		}

		// Validate label presence and type (matches PHP empty() + is_string())
		if ( ! args.label || typeof args.label !== 'string' ) {
			throw new Error(
				'The category properties must contain a `label` string.'
			);
		}

		// Validate description presence and type (matches PHP empty() + is_string())
		if ( ! args.description || typeof args.description !== 'string' ) {
			throw new Error(
				'The category properties must contain a `description` string.'
			);
		}

		if (
			args.meta !== undefined &&
			( typeof args.meta !== 'object' || Array.isArray( args.meta ) )
		) {
			throw new Error(
				'The category properties should provide a valid `meta` object.'
			);
		}

		const annotations = filterAnnotations( args.meta?.annotations, [
			'serverRegistered',
			'clientRegistered',
		] );

		if ( ! annotations.serverRegistered ) {
			annotations.clientRegistered = true;
		}

		const meta = { annotations };
		const category: AbilityCategory = {
			slug,
			label: args.label,
			description: args.description,
			meta,
		};

		dispatch( {
			type: REGISTER_ABILITY_CATEGORY,
			category,
		} );
	};
}

/**
 * Returns an action object used to unregister a client-side ability category.
 *
 * @param slug The slug of the category to unregister.
 * @return Action object.
 */
export function unregisterAbilityCategory( slug: string ) {
	return {
		type: UNREGISTER_ABILITY_CATEGORY,
		slug,
	};
}
