import React, { useState } from 'react';
import DosPlayer from '../dos/DosPlayer';
import Window from '../os/Window';
const ScrabbleApp = (props) => {
    const [width, setWidth] = useState(920);
    const [height, setHeight] = useState(750);
    return (React.createElement(Window, { top: 10, left: 10, width: width, height: height, windowTitle: "Scrabble", windowBarIcon: "windowGameIcon", windowBarColor: "#941d13", bottomLeftText: 'Powered by JSDOS & DOSBox', closeWindow: props.onClose, onInteract: props.onInteract, onWidthChange: setWidth, onHeightChange: setHeight, minimizeWindow: props.onMinimize },
        React.createElement(DosPlayer, { width: width, height: height, bundleUrl: "/os-games/scrabble.jsdos" })));
};
export default ScrabbleApp;
