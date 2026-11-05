import clsx from 'clsx';
import { memo } from '@wordpress/element';
import { isShallowEqual } from '@wordpress/is-shallow-equal';
import type { DataRegistry } from '@wordpress/data';
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

type BlockSupportCache = {
	attributes: Record< string, unknown >;
	active: Array< [ number, BlockListBlockFeatureProps ] >;
	supports: Map<
		number,
		{
			props: BlockListBlockFeatureProps;
			context: BlockSupportContext;
			wrapperProps: BlockListWrapperProps;
		}
	>;
};

// Each block's active supports for its attributes, and each support's last
// props, context and wrapper props. The key is the block's record, which
// attribute updates keep.
const cache = new WeakMap< object, BlockSupportCache >();

// The props of each block support the block uses: one with any of its
// attributes set, that the block supports and that matches them.
function getActiveBlockSupports(
	name: string,
	clientId: string,
	attributes: Record< string, unknown >,
	block: object
) {
	const blockCache = cache.get( block );
	if ( blockCache?.attributes === attributes ) {
		return blockCache;
	}
	const active: BlockSupportCache[ 'active' ] = [];
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
	// Keep the last props of the supports still in use only.
	const supports: BlockSupportCache[ 'supports' ] = new Map();
	for ( const [ index ] of active ) {
		const cached = blockCache?.supports.get( index );
		if ( cached ) {
			supports.set( index, cached );
		}
	}
	const newBlockCache = { attributes, active, supports };
	cache.set( block, newBlockCache );
	return newBlockCache;
}

const SETTING_PREFIX = 'blockSupportSetting:';
const DATA_PREFIX = 'blockSupportData:';

/**
 * Selects the settings and store values the block's supports read, one key per
 * value, so the block's subscription compares them one by one.
 *
 * @param name             The block name.
 * @param clientId         The block client ID.
 * @param attributes       The block attributes.
 * @param block            The block's record in the store.
 * @param select           The registry's `select`.
 * @param getBlockSettings Returns the values of the settings at the paths.
 *
 * @return The values by prefixed key.
 */
export function selectBlockSupports(
	name: string,
	clientId: string,
	attributes: Record< string, unknown >,
	block: object,
	select: DataRegistry[ 'select' ],
	getBlockSettings: ( ...paths: string[] ) => unknown[]
) {
	const selected: Record< string, unknown > = {};
	const paths = new Set< string >();
	for ( const [ index, props ] of getActiveBlockSupports(
		name,
		clientId,
		attributes,
		block
	).active ) {
		const support = blockSupports[ index ];
		support.settings?.forEach( ( path ) => paths.add( path ) );
		const values = support.select?.( select, props );
		for ( const key in values ) {
			selected[ `${ DATA_PREFIX }${ index }:${ key }` ] = values[ key ];
		}
	}
	// Most blocks read no settings, so skip walking up their parents.
	if ( paths.size ) {
		const values = getBlockSettings( ...paths );
		[ ...paths ].forEach( ( path, i ) => {
			selected[ SETTING_PREFIX + path ] = values[ i ];
		} );
	}
	return selected;
}

/**
 * Returns the values selected by `selectBlockSupports` by support index.
 *
 * @param selected The selected props.
 *
 * @return The values by support index.
 */
export function getBlockSupportData( selected: Record< string, unknown > ) {
	const data: Record< number, Record< string, unknown > > = {};
	for ( const key in selected ) {
		if ( key.startsWith( DATA_PREFIX ) ) {
			const [ index, name ] = key
				.slice( DATA_PREFIX.length )
				.split( ':' );
			data[ Number( index ) ] ??= {};
			data[ Number( index ) ][ name ] = selected[ key ];
		}
	}
	return data;
}

/**
 * Returns the settings selected by `selectBlockSupports` by path.
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

// Supports only read their props and context, so equal ones give equal results.
function isSameContext( a: BlockSupportContext, b: BlockSupportContext ) {
	return (
		a.parentLayout === b.parentLayout &&
		isShallowEqual( a.settings, b.settings )
	);
}

type BlockSupportStylesProps = BlockListBlockFeatureProps & {
	useStyles: NonNullable< BlockListBlockFeature[ 'useStyles' ] >;
	context: BlockSupportContext;
};

const BlockSupportStyles = memo(
	function BlockSupportStylesPure( {
		useStyles,
		context,
		...props
	}: BlockSupportStylesProps ) {
		useStyles( props, context );
		return null;
	},
	(
		{ context: prevContext, ...prevProps }: BlockSupportStylesProps,
		{ context: nextContext, ...nextProps }: BlockSupportStylesProps
	) =>
		isShallowEqual( prevProps, nextProps ) &&
		isSameContext( prevContext, nextContext )
);

/**
 * Returns the block supports' wrapper props, and renders their side effects.
 *
 * @param name       The block name.
 * @param clientId   The block client ID.
 * @param attributes The block attributes.
 * @param context    What the block supports read besides attributes.
 * @param data       The store values selected by `selectBlockSupports`, by
 *                   support index.
 * @param block      The block's record in the store.
 *
 * @return The wrapper props and the side effects to render.
 */
export function getBlockSupportProps(
	name: string,
	clientId: string,
	attributes: Record< string, unknown >,
	context: BlockSupportContext,
	data: Record< number, Record< string, unknown > >,
	block: object
) {
	const { active, supports } = getActiveBlockSupports(
		name,
		clientId,
		attributes,
		block
	);
	let wrapperProps: BlockListWrapperProps = {};
	const effects = [];
	for ( const [ index, props ] of active ) {
		const { getBlockProps, useStyles } = blockSupports[ index ];
		const supportProps = data[ index ]
			? { ...props, ...data[ index ] }
			: props;
		// Reuse the support's last props when what it reads is unchanged, as
		// when typing in the block.
		let cached = supports.get( index );
		if (
			! cached ||
			! isShallowEqual( cached.props, supportProps ) ||
			! isSameContext( cached.context, context )
		) {
			cached = {
				props: supportProps,
				context,
				// Block supports set valid style values.
				wrapperProps: getBlockProps(
					supportProps,
					context
				) as BlockListWrapperProps,
			};
			supports.set( index, cached );
		}
		wrapperProps = mergeWrapperProps( wrapperProps, cached.wrapperProps );
		if ( useStyles ) {
			effects.push(
				<BlockSupportStyles
					// The list of block supports is fixed per page load.
					key={ index }
					useStyles={ useStyles }
					context={ context }
					{ ...supportProps }
				/>
			);
		}
	}
	return { wrapperProps, effects };
}
