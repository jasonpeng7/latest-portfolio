import React from 'react';
import Window from '../os/Window';
import Wordle from '../wordle/Wordle';
const JasonWordApp = (props) => {
    return (React.createElement(Window, { top: 20, left: 300, width: 600, height: 860, windowBarIcon: "windowGameIcon", windowTitle: "JasonWord", closeWindow: props.onClose, onInteract: props.onInteract, minimizeWindow: props.onMinimize, bottomLeftText: 'JasonOS · Word game' },
        React.createElement("div", { className: "site-page" },
            React.createElement(Wordle, null))));
};
export default JasonWordApp;
