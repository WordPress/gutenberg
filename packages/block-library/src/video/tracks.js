export default function Tracks( { tracks = [] } ) {
	return tracks.map( ( track ) => {
		const { id, ...trackAttrs } = track;
		return <track key={ id ?? trackAttrs.src } { ...trackAttrs } />;
	} );
}
