export type Side = 'top' | 'right' | 'bottom' | 'left';

export type SideValues = Partial< Record< Side | 'all', string | undefined > >;

export interface SpacingSize {
	name?: string;
	slug: string | number;
	size?: string;
}
