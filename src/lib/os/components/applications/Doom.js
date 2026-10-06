import React, { useState } from 'react';
import DosPlayer from '../dos/DosPlayer';
import Window from '../os/Window';
const DoomApp = (props) => {
    const [width, setWidth] = useState(980);
    const [height, setHeight] = useState(670);
    return (React.createElement(Window, { top: 10, left: 10, width: width, height: height, windowTitle: "Doom", windowBarColor: "#1C1C1C", windowBarIcon: "windowGameIcon", bottomLeftText: 'Powered by JSDOS & DOSBox', closeWindow: props.onClose, onInteract: props.onInteract, minimizeWindow: props.onMinimize, onWidthChange: setWidth, onHeightChange: setHeight },
        React.createElement(DosPlayer, { width: width, height: height, bundleUrl: "/os-games/doom.jsdos" })));
};
export default DoomApp;
