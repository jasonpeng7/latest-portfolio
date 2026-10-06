import React from 'react';
import { styles } from './DragIndicator';
const ResizeIndicator = ({ resizeRef, top, left, width, height, }) => {
    return (React.createElement("div", { style: Object.assign({}, styles.draggable, {
            top,
            left,
            width,
            height,
        }), ref: resizeRef },
        React.createElement("div", { style: {
                position: 'absolute',
                width: 32,
                height: 32,
                bottom: -20,
                right: -20,
            } }),
        React.createElement("div", { style: Object.assign({}, styles.hozDrag, styles.checkerboard) }),
        React.createElement("div", { style: styles.vertDragContainer },
            React.createElement("div", { style: Object.assign({}, styles.vertDrag, styles.checkerboard) }),
            React.createElement("div", { style: Object.assign({}, styles.vertDrag, styles.checkerboard) })),
        React.createElement("div", { style: Object.assign({}, styles.hozDrag, styles.checkerboard) })));
};
export default ResizeIndicator;
