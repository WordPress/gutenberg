/**
 * Unique identifier for an item being processed.
 */
export type ItemId = string;

/**
 * ISO 21496-1 Gain Map Metadata.
 *
 * Contains all the metadata required to interpret and apply a gain map
 * according to the ISO 21496-1 specification.
 */
export interface GainMapMetadata {
	/** Specification version (e.g., "1.0") */
	version: string;

	/** Whether the base rendition is HDR (false = SDR base, true = HDR base) */
	baseRenditionIsHdr: boolean;

	/** Minimum gain value per channel (RGB), in log2 scale */
	gainMapMin: number[];

	/** Maximum gain value per channel (RGB), in log2 scale */
	gainMapMax: number[];

	/** Gamma correction per channel (RGB) */
	gamma: number[];

	/** SDR offset per channel (RGB), used for black point adjustment */
	offsetSdr: number[];

	/** HDR offset per channel (RGB), used for black point adjustment */
	offsetHdr: number[];

	/** Minimum HDR capacity (log2 scale) where gain map starts to apply */
	hdrCapacityMin: number;

	/** Maximum HDR capacity (log2 scale) for full HDR output */
	hdrCapacityMax: number;
}

/**
 * Result of decoding an UltraHDR image.
 */
export interface UltraHdrDecodeResult {
	/** The SDR base image as JPEG bytes */
	sdrImage: Uint8Array;

	/** The gain map as JPEG bytes */
	gainMap: Uint8Array;

	/** Gain map metadata */
	metadata: GainMapMetadata;

	/** Image width in pixels */
	width: number;

	/** Image height in pixels */
	height: number;

	/** Gain map width in pixels (may differ from image width) */
	gainMapWidth: number;

	/** Gain map height in pixels (may differ from image height) */
	gainMapHeight: number;
}

/**
 * Options for encoding UltraHDR images.
 */
export interface UltraHdrEncodeOptions {
	/** JPEG quality for the base image (1-100) */
	baseQuality: number;

	/** JPEG quality for the gain map (1-100) */
	gainMapQuality: number;

	/** Target HDR capacity (typically 2.0-4.0) */
	targetHdrCapacity: number;

	/** Whether to include ISO 21496-1 metadata */
	includeIsoMetadata: boolean;

	/** Whether to include UltraHDR v1 metadata for Android compatibility */
	includeUltrahdrV1: boolean;

	/** Downscale factor for the gain map (1 = same size, 2 = half, 4 = quarter) */
	gainMapScale: number;
}

/**
 * Color gamut enumeration for HDR images.
 */
export enum ColorGamut {
	/** Standard sRGB color space (BT.709 primaries) */
	Srgb = 0,
	/** Display P3 wide color gamut */
	DisplayP3 = 1,
	/** BT.2100/BT.2020 wide color gamut (HDR) */
	Bt2100 = 2,
}

/**
 * Transfer function for encoding luminance.
 */
export enum TransferFunction {
	/** sRGB transfer function (gamma ~2.2) */
	Srgb = 0,
	/** Linear (no gamma) */
	Linear = 1,
	/** Perceptual Quantizer (PQ) - SMPTE ST 2084 */
	Pq = 2,
	/** Hybrid Log-Gamma (HLG) - BT.2100 */
	Hlg = 3,
}

/**
 * Default encoding options.
 */
export const defaultEncodeOptions: UltraHdrEncodeOptions = {
	baseQuality: 85,
	gainMapQuality: 75,
	targetHdrCapacity: 3.0,
	includeIsoMetadata: true,
	includeUltrahdrV1: true,
	gainMapScale: 1,
};

/**
 * High quality encoding options.
 */
export const highQualityEncodeOptions: UltraHdrEncodeOptions = {
	baseQuality: 95,
	gainMapQuality: 85,
	targetHdrCapacity: 4.0,
	includeIsoMetadata: true,
	includeUltrahdrV1: true,
	gainMapScale: 1,
};

/**
 * Small size encoding options.
 */
export const smallSizeEncodeOptions: UltraHdrEncodeOptions = {
	baseQuality: 75,
	gainMapQuality: 65,
	targetHdrCapacity: 3.0,
	includeIsoMetadata: true,
	includeUltrahdrV1: true,
	gainMapScale: 2,
};
