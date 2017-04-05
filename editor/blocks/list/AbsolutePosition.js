
export default function AbsolutePosition ({ top, left, extraStyles, children}) {
    let style = {
      position: 'absolute',
      top,
      left
    }
    style = extraStyles != null ? {...style, ...extraStyles } : style;
    // console.log('>AbsPos', style)

    return (
      <div style={style}>
        {children}
      </div>
    );
}


AbsolutePosition.propTypes = {
  top: React.PropTypes.number,
  left: React.PropTypes.number,
  extraStyles: React.PropTypes.object,
  // closePortal: React.PropTypes.func,
};