import React from 'react';
import getIconByName from '../../assets/icons';
const Icon = ({ icon, style, size }) => {
    const iconStyle = Object.assign({}, styles.icon, style, size && { width: size, height: size });
    return (React.createElement("img", { style: iconStyle, alt: '', src: getIconByName(icon) }));
};
const styles = {
    icon: {
        imageRendering: 'pixelated',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: 'none',
    },
};
export default Icon;
