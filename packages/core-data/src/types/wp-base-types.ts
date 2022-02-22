/**
 * This module exists solely to make the CoreBaseEntityTypes namespace extensible
 * with declaration merging:
 *
 * ```ts
 * declare module './wp-base-types' {
 *     export namespace CoreBaseEntityTypes {
 * 		     export interface Comment< C extends Context > {
 * 		         id: number;
 * 		         // ...
 * 	       }
 * 	   }
 * }
 * ```
 *
 * The huge upside is that consumers of @wordpress/core-data may extends the
 * exported data types using interface merging as follows:
 *
 * ```ts
 * import type { Context } from '@wordpress/core-data';
 * declare module '@wordpress/core-data' {
 *     export namespace CoreBaseEntityTypes {
 *         export interface Comment< C extends Context > {
 *             numberOfViews: number;
 *         }
 *     }
 * }
 *
 * import type { Comment } from '@wordpress/core-data';
 * const c : Comment< 'view' > = ...;
 *
 * // c.numberOfViews is a number
 * // c.id is still present
 * ```
 */
export namespace CoreBaseEntityTypes {}
