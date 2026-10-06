import React, { useState } from 'react';
import DosPlayer from '../dos/DosPlayer';
import Window from '../os/Window';
const OregonTrailApp = (props) => {
    const [width, setWidth] = useState(920);
    const [height, setHeight] = useState(750);
    return (React.createElement(Window, { top: 10, left: 10, width: width, height: height, windowTitle: "The Oregon Trail", windowBarIcon: "windowGameIcon", windowBarColor: "#240C00", bottomLeftText: 'Powered by JSDOS & DOSBox', closeWindow: props.onClose, onInteract: props.onInteract, minimizeWindow: props.onMinimize, onWidthChange: setWidth, onHeightChange: setHeight },
        React.createElement(DosPlayer, { width: width, height: height, bundleUrl: "/os-games/trail.jsdos" })));
};
export default OregonTrailApp;
