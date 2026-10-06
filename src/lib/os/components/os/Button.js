import React, { useState } from 'react';
import Colors from '../../constants/colors';
import { Icon } from '../general';
const Button = ({ icon, text, onClick }) => {
    const [isHovering, setIsHovering] = useState(false);
    const handleMouseEnter = () => {
        setIsHovering(true);
    };
    const handleMouseLeave = () => {
        setIsHovering(false);
    };
    const outerBorderStyle = Object.assign({}, styles.outerBorder, icon && { width: 16, height: 14 });
    const innerBorderStyle = Object.assign({}, styles.innerBorder, icon && { width: 12, height: 12 }, text && { padding: 4 });
    const click = (e) => {
        e.preventDefault();
        onClick && onClick();
    };
    return (React.createElement("button", { type: "button", "aria-label": icon || text, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, style: outerBorderStyle, onClick: click },
        React.createElement("div", { style: Object.assign({}, isHovering && { backgroundColor: Colors.darkGray }, innerBorderStyle) },
            icon && React.createElement(Icon, { icon: icon, style: styles.icon }),
            text && (
            // <Text noSelect style={styles.text}>
            //     {text}
            // </Text>
            React.createElement("p", null, text)))));
};
const styles = {
    outerBorder: {
        padding: 0,
        display: 'flex',
        borderRadius: 0,
        border: `1px solid ${Colors.black}`,
        borderTopColor: Colors.white,
        borderLeftColor: Colors.white,
        background: Colors.lightGray,
        cursor: 'pointer',
    },
    innerBorder: {
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.lightGray,
        borderLeftColor: Colors.lightGray,
        flex: 1,
    },
};
export default Button;
