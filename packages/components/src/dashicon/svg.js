export default function SVG( props, ref ) {
    const { size, path, iconClass } = props
    return (
        <svg
            aria-hidden
            role="img"
            focusable="false"
            className={ iconClass }
            xmlns="http://www.w3.org/2000/svg"
            width={ size }
            height={ size }
            viewBox="0 0 20 20"
        >
            <path d={ path } />
        </svg>
    );
}