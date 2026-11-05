import clsx from 'clsx';
import type {
	BlockListBlockFeature,
	BlockListBlockFeatureProps,
	BlockSupportContext,
} from '../../hooks/types';
import type { BlockListWrapperProps } from './types';

const blockSupports: BlockListBlockFeature[] = [];

// Supports apply to the block list in the order they're registered.
export function registerBlockSupport( support: BlockListBlockFeature ) {
	blockSupports.push( support );
}

// The props of each block support the block uses: one with any of its
// attributes set, that the block supports and that matches them.
function getActiveBlockSupports(
	name: string,
	clientId: string,
	attributes: Record< string, unknown >
) {
	const active: Array< [ number, BlockListBlockFeatureProps ] > = [];
	blockSupports.forEach( ( feature, index ) => {
		const neededProps: Record< string, unknown > = {};
		for ( const key of feature.attributeKeys ?? [] ) {
			if ( attributes[ key ] ) {
				neededProps[ key ] = attributes[ key ];
			}
		}
		if (
			Object.keys( neededProps ).length &&
			feature.hasSupport( name ) &&
			( ! feature.isMatch || feature.isMatch( neededProps ) )
		) {
			active.push( [ index, { name, clientId, ...neededProps } ] );
		}
	} );
	return active;
}

const SETTING_PREFIX = 'blockSupportSetting:';

/**
 * Selects the settings the block's supports read, one key per setting, so the
 * block's subscription compares them one by one.
 *
 * @param name             The block name.
 * @param clientId         The block client ID.
 * @param attributes       The block attributes.
 * @param getBlockSettings Returns the values of the settings at the paths.
 *
 * @return The settings by prefixed path.
 */
export function selectBlockSupportSettings(
	name: string,
	clientId: string,
	attributes: Record< string, unknown >,
	getBlockSettings: ( ...paths: string[] ) => unknown[]
) {
	const paths = new Set< string >();
	for ( const [ index ] of getActiveBlockSupports(
		name,
		clientId,
		attributes
	) ) {
		blockSupports[ index ].settings?.forEach( ( path ) =>
			paths.add( path )
		);
	}
	const values = getBlockSettings( ...paths );
	return Object.fromEntries(
		[ ...paths ].map( ( path, i ) => [
			SETTING_PREFIX + path,
			values[ i ],
		] )
	);
}

/**
 * Returns the settings selected by `selectBlockSupportSettings` by path.
 *
 * @param selected The selected props.
 *
 * @return The settings by path.
 */
export function getBlockSupportSettings( selected: Record< string, unknown > ) {
	const settings: Record< string, unknown > = {};
	for ( const key in selected ) {
		if ( key.startsWith( SETTING_PREFIX ) ) {
			settings[ key.slice( SETTING_PREFIX.length ) ] = selected[ key ];
		}
	}
	return settings;
}

/**
 * Merges wrapper props with special handling for classNames and styles.
 *
 * @param propsA
 * @param propsB
 *
 * @return Merged props.
 */
export function mergeWrapperProps(
	propsA: BlockListWrapperProps | undefined,
	propsB: BlockListWrapperProps | undefined
): BlockListWrapperProps {
	const newProps: BlockListWrapperProps = {
		...propsA,
		...propsB,
	};

	// May be set to undefined, so check if the property is set!
	if (
		propsA?.hasOwnProperty( 'className' ) &&
		propsB?.hasOwnProperty( 'className' )
	) {
		newProps.className = clsx( propsA.className, propsB.className );
	}

	if (
		propsA?.hasOwnProperty( 'style' ) &&
		propsB?.hasOwnProperty( 'style' )
	) {
		newProps.style = { ...propsA.style, ...propsB.style };
	}

	return newProps;
}

function BlockSupportStyles( {
	useStyles,
	context,
	...props
}: BlockListBlockFeatureProps & {
	useStyles: NonNullable< BlockListBlockFeature[ 'useStyles' ] >;
	context: BlockSupportContext;
} ) {
	useStyles( props, context );
	return null;
}

/**
 * Returns the block supports' wrapper props, and renders their side effects.
 *
 * @param name       The block name.
 * @param clientId   The block client ID.
 * @param attributes The block attributes.
 * @param context    What the block supports read besides attributes.
 *
 * @return The wrapper props and the side effects to render.
 */
export function getBlockSupportProps(
	name: string,
	clientId: string,
	attributes: Record< string, unknown >,
	context: BlockSupportContext
) {
	let wrapperProps: BlockListWrapperProps = {};
	const effects = [];
	for ( const [ index, props ] of getActiveBlockSupports(
		name,
		clientId,
		attributes
	) ) {
		const { getBlockProps, useStyles } = blockSupports[ index ];
		wrapperProps = mergeWrapperProps(
			wrapperProps,
			// Block supports set valid style values.
			getBlockProps( props, context ) as BlockListWrapperProps
		);
		if ( useStyles ) {
			effects.push(
				<BlockSupportStyles
					// The list of block supports is fixed per page load.
					key={ index }
					useStyles={ useStyles }
					context={ context }
					{ ...props }
				/>
			);
		}
	}
	return { wrapperProps, effects };
}
